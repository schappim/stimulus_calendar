// Interaction plugin — pointer-driven editing: dateClick, drag/drop,
// resize, range selection. Mirrors the upstream Interaction plugin's
// option surface; pointer geometry is wired via the per-view DOM
// listeners (DayGrid month cells emit dateClick; TimeGrid event chips
// emit drag/resize). Selection rendering is minimal (highlight class
// on selected cells).

export const InteractionPlugin = {
  createOptions(options) {
    Object.assign(options, {
      dateClick: undefined,
      dragConstraint: undefined,
      dragScroll: true,
      editable: false,
      eventDragMinDistance: 5,
      eventDragStart: undefined,
      eventDragStop: undefined,
      eventDrop: undefined,
      eventDurationEditable: true,
      eventLongPressDelay: undefined,
      eventResizableFromStart: false,
      eventResizeStart: undefined,
      eventResizeStop: undefined,
      eventResize: undefined,
      eventStartEditable: true,
      longPressDelay: 1000,
      pointer: false,
      resizeConstraint: undefined,
      select: undefined,
      selectBackgroundColor: undefined,
      selectConstraint: undefined,
      selectLongPressDelay: undefined,
      selectMinDistance: 5,
      snapDuration: undefined,
      unselect: undefined,
      unselectAuto: true,
      unselectCancel: '',
    });
    Object.assign(options.theme, {
      draggable: 'ec-draggable',
      ghost: 'ec-ghost',
      preview: 'ec-preview',
      pointer: 'ec-pointer',
      resizer: 'ec-resizer',
      start: 'ec-start',
      dragging: 'ec-dragging',
      resizingY: 'ec-resizing-y',
      resizingX: 'ec-resizing-x',
      selecting: 'ec-selecting',
    });
  },

  initState(mainState) {
    // The aux components list is where view-mounted interaction overlays
    // hook in (ghost/preview chips during drag, range highlight during
    // select). Each view-specific wiring registers a setupFn here that
    // attaches DOM listeners after view mount.
    mainState.get('auxComponents').push({
      name: 'interaction',
      mount(rootEl, state) {
        const offClick  = attachDateClickHandler(rootEl, state);
        const offDrag   = attachEventDragHandler(rootEl, state);
        const offResize = attachEventResizeHandler(rootEl, state);
        return () => { offClick(); offDrag(); offResize(); };
      },
    });
  },
};

// Attach a delegated click handler that finds the cell under the pointer
// and fires options.dateClick. This is the minimum-viable interaction —
// drag/resize wire up similarly when a touch/mouse-down lands on an event
// with data-event-id (and editable is on).
// Attach pointer-driven event drag (move). Hit-tests on pointermove to
// figure out which calendar cell the pointer is over; on pointerup, if
// the cell differs from the source, fires options.eventDrop +
// calendar:eventDrop with the candidate new times and gives listeners
// the chance to `revert()` (mirrors upstream FullCalendar/vkurko shape).
//
// This is the minimum-viable drag pipeline — resize and selection use
// the same primitives in follow-up work. Touch + keyboard hooks land
// alongside the accessibility pass.
function attachEventDragHandler(rootEl, state) {
  let drag = null;   // { event, sourceChip, ghost, startX, startY, sourceDateStr, timeCol }

  const findEventChip = (target) => target.closest?.('[data-event-id]');
  const cellAtPoint = (x, y) => {
    const els = (typeof document !== 'undefined' && document.elementsFromPoint)
      ? document.elementsFromPoint(x, y) : [];
    for (const el of els) {
      const cell = el.closest?.('[data-date]');
      if (cell && rootEl.contains(cell)) return cell;
    }
    return null;
  };
  const timeColAtPoint = (x, y) => {
    const els = (typeof document !== 'undefined' && document.elementsFromPoint)
      ? document.elementsFromPoint(x, y) : [];
    for (const el of els) {
      const col = el.closest?.('.ec-time-col');
      if (col && rootEl.contains(col)) return col;
    }
    return null;
  };

  const onPointerDown = (jsEvent) => {
    const options = state.get('options');
    if (!options.editable && !options.eventStartEditable) return;
    if (jsEvent.button !== undefined && jsEvent.button !== 0) return;
    // Resize handles handle their own gesture — keep drag out of their way.
    if (jsEvent.target.closest?.('.ec-resizer')) return;
    const chip = findEventChip(jsEvent.target);
    if (!chip) return;
    const id = chip.getAttribute('data-event-id');
    const event = (state.get('filteredEvents') ?? []).find((e) => e.id === id);
    if (!event) return;
    const sourceCell = chip.closest('[data-date]');
    const sourceTimeCol = chip.closest('.ec-time-col');
    drag = {
      event,
      sourceChip: chip,
      sourceDateStr: sourceCell?.getAttribute('data-date'),
      sourceTimeCol,
      startX: jsEvent.clientX,
      startY: jsEvent.clientY,
      ghost: null,
      moved: false,
    };
    // Capture pointer so subsequent move/up land on the same element.
    if (chip.setPointerCapture && jsEvent.pointerId !== undefined) {
      try { chip.setPointerCapture(jsEvent.pointerId); } catch { /* ignore */ }
    }
  };

  const onPointerMove = (jsEvent) => {
    if (!drag) return;
    const dx = jsEvent.clientX - drag.startX;
    const dy = jsEvent.clientY - drag.startY;
    const options = state.get('options');
    const minDist = options.eventDragMinDistance ?? 5;
    if (!drag.moved && (dx * dx + dy * dy) < minDist * minDist) return;
    if (!drag.moved) {
      drag.moved = true;
      state.get('fire')?.('eventDragStart', {
        event: drag.event, jsEvent, view: state.get('view'),
      });
      // Build a follow-the-pointer ghost copy of the chip. Keep it
      // inside the calendar's view-family scope (.ec-time-grid /
      // .ec-day-grid / .ec-list / .ec-timeline) so the descendant CSS
      // rules that style the chip (font, padding, dot, time text) still
      // apply — appending to document.body strips that cascade and the
      // ghost ends up with default browser styling.
      const ghost = drag.sourceChip.cloneNode(true);
      ghost.classList.add(options.theme.ghost ?? 'ec-ghost');
      ghost.style.position = 'fixed';
      ghost.style.pointerEvents = 'none';
      ghost.style.opacity = '0.85';
      ghost.style.zIndex = '1000';
      // Lock the cloned dimensions so the ghost stays the same size as
      // the source chip regardless of any margin/padding/grid layout
      // it inherits from its new parent.
      const rect = drag.sourceChip.getBoundingClientRect();
      ghost.style.width  = `${rect.width}px`;
      ghost.style.height = `${rect.height}px`;
      ghost.style.left = `${rect.left}px`;
      ghost.style.top  = `${rect.top}px`;
      // Reset positioning inside grid/flex parents.
      ghost.style.margin = '0';
      ghost.style.right = 'auto';
      ghost.style.bottom = 'auto';
      drag.ghost = ghost;
      // Keep the ghost inside the same view-scope as the source chip so
      // descendant CSS rules that style the chip stay in cascade. The
      // MonthScroller's chips live under .ec-month-scroller-cell, which
      // also needs to be in the closest() list — otherwise the ghost
      // ends up at document.body and loses the .ec-month-scroller-cell
      // .ec-event font / padding / dot styles.
      const scope = drag.sourceChip.closest('.ec-month-scroller-cell, .ec-month-scroller, .ec-time-grid, .ec-day-grid, .ec-list, .ec-timeline, .ec') ?? document.body;
      scope.appendChild(ghost);
      drag.sourceChip.style.opacity = '0.4';
      document.body.classList.add('ec-dragging');
    }
    if (drag.ghost) {
      drag.ghost.style.left = `${jsEvent.clientX - 20}px`;
      drag.ghost.style.top  = `${jsEvent.clientY - 10}px`;
    }
    // Preventing default while actively dragging stops the browser from
    // hijacking touch gestures (e.g. iOS swipe-back, page rubber-band).
    if (jsEvent.cancelable) jsEvent.preventDefault();
  };

  const onPointerUp = (jsEvent) => {
    if (!drag) return;
    const d = drag; drag = null;
    document.body.classList.remove('ec-dragging');
    if (d.ghost) d.ghost.remove();
    if (d.sourceChip) d.sourceChip.style.opacity = '';
    if (!d.moved) return;     // tap, not a drag

    const targetCell = cellAtPoint(jsEvent.clientX, jsEvent.clientY);
    const targetDateStr = targetCell?.getAttribute('data-date');
    const targetTimeCol = timeColAtPoint(jsEvent.clientX, jsEvent.clientY);
    state.get('fire')?.('eventDragStop', {
      event: d.event, jsEvent, view: state.get('view'),
    });
    if (!targetDateStr) return;

    // Decide between a day-grid (whole-day) shift and a TimeGrid (sub-day
    // snapped to snapDuration ?? slotDuration) shift. TimeGrid carries
    // .ec-time-col on both source and target; without it, fall through
    // to day-grid logic. snapDuration governs the resolution at which
    // drops snap (e.g. 15-min ticks even when slotDuration is 30-min).
    const options = state.get('options');
    const slotMins = totalSecondsOfDuration(options.slotDuration) / 60 || 30;
    const snapMins = totalSecondsOfDuration(options.snapDuration) / 60 || slotMins;
    const slotHeight = options.slotHeight ?? 22;
    const pxPerMin = slotHeight / slotMins;

    let newStart, newEnd, delta;
    if (d.sourceTimeCol && targetTimeCol) {
      // Compute the target time-of-day from the y-position within the
      // target column, snapped to slotDuration.
      const colRect = targetTimeCol.getBoundingClientRect();
      const sourceColRect = d.sourceTimeCol.getBoundingClientRect();
      const yInTargetCol = jsEvent.clientY - colRect.top;
      const yInSourceCol = d.startY - sourceColRect.top;
      const minOffset = (yInTargetCol - yInSourceCol) / pxPerMin;
      const snappedMin = Math.round(minOffset / snapMins) * snapMins;
      // Day-of-day part: target date - source date.
      const fromMid = new Date(d.sourceDateStr + 'T00:00:00Z').getTime();
      const toMid   = new Date(targetDateStr   + 'T00:00:00Z').getTime();
      const dayDelta = toMid - fromMid;
      delta = dayDelta + snappedMin * 60_000;
    } else {
      // DayGrid / List / etc — whole-day shift only.
      if (targetDateStr === d.sourceDateStr) return;
      const fromMid = new Date(d.sourceDateStr + 'T00:00:00Z').getTime();
      const toMid   = new Date(targetDateStr   + 'T00:00:00Z').getTime();
      delta = toMid - fromMid;
    }
    if (delta === 0) return;
    newStart = new Date(d.event.start.getTime() + delta);
    newEnd   = new Date(d.event.end.getTime()   + delta);

    const dayMs = 86400000;
    let reverted = false;
    state.get('fire')?.('eventDrop', {
      event: d.event,
      oldEvent: { ...d.event, start: d.event.start, end: d.event.end },
      delta: { days: Math.round(delta / dayMs), milliseconds: delta },
      jsEvent,
      view: state.get('view'),
      revert: () => { reverted = true; },
    });
    if (reverted) return;

    // Commit the change through the public API so it broadcasts + re-renders.
    state.get('hostEl')?.calendarApi?.updateEvent({
      id: d.event.id,
      start: newStart.toISOString(),
      end:   newEnd.toISOString(),
    });
  };

  rootEl.addEventListener('pointerdown', onPointerDown);
  document.addEventListener('pointermove', onPointerMove, { passive: false });
  document.addEventListener('pointerup',   onPointerUp);
  document.addEventListener('pointercancel', onPointerUp);

  return () => {
    rootEl.removeEventListener('pointerdown', onPointerDown);
    document.removeEventListener('pointermove', onPointerMove);
    document.removeEventListener('pointerup',   onPointerUp);
    document.removeEventListener('pointercancel', onPointerUp);
    if (drag?.ghost) drag.ghost.remove();
  };
}

// Resize handles — dragging the chip's bottom (or top, when
// eventResizableFromStart) edge resizes the event's end (or start)
// snapping to slotDuration. Commits via api.updateEvent on pointerup.
function attachEventResizeHandler(rootEl, state) {
  let rs = null;
  // { chip, handleSide, event, startY, originalRect, pxPerMin, slotMins }

  const onPointerDown = (jsEvent) => {
    const options = state.get('options');
    if (!options.editable && !options.eventDurationEditable) return;
    if (jsEvent.button !== undefined && jsEvent.button !== 0) return;
    const handle = jsEvent.target.closest?.('.ec-resizer');
    if (!handle || !rootEl.contains(handle)) return;
    const chip = handle.closest('[data-event-id]');
    if (!chip) return;
    const id = chip.getAttribute('data-event-id');
    const event = (state.get('filteredEvents') ?? []).find((e) => e.id === id);
    if (!event) return;
    const slotMins = totalSecondsOfDuration(options.slotDuration) / 60 || 30;
    const snapMins = totalSecondsOfDuration(options.snapDuration) / 60 || slotMins;
    const pxPerMin = (options.slotHeight ?? 22) / slotMins;
    rs = {
      chip,
      handleSide: handle.getAttribute('data-resizer') === 'start' ? 'start' : 'end',
      event,
      startY: jsEvent.clientY,
      originalTopPx: parseFloat(chip.style.top || '0') || 0,
      originalHeightPx: parseFloat(chip.style.height || '0') || chip.getBoundingClientRect().height,
      pxPerMin,
      slotMins,
      snapMins,
      moved: false,
    };
    chip.classList.add('ec-resizing-y');
    chip.classList.add('ec-resizing');
    if (handle.setPointerCapture && jsEvent.pointerId !== undefined) {
      try { handle.setPointerCapture(jsEvent.pointerId); } catch { /* ignore */ }
    }
    state.get('fire')?.('eventResizeStart', { event, jsEvent, view: state.get('view') });
    if (jsEvent.cancelable) jsEvent.preventDefault();
    jsEvent.stopPropagation();
  };

  const onPointerMove = (jsEvent) => {
    if (!rs) return;
    const dy = jsEvent.clientY - rs.startY;
    const deltaMin = Math.round((dy / rs.pxPerMin) / rs.snapMins) * rs.snapMins;
    if (deltaMin !== 0) rs.moved = true;
    if (rs.handleSide === 'end') {
      const newH = Math.max(rs.snapMins * rs.pxPerMin, rs.originalHeightPx + deltaMin * rs.pxPerMin);
      rs.chip.style.height = `${newH}px`;
    } else {
      // Resize-from-start: shift top down (or up) and shrink (or grow) height.
      const shift = Math.max(
        -rs.originalTopPx, // can't go above col start
        Math.min(rs.originalHeightPx - rs.snapMins * rs.pxPerMin, deltaMin * rs.pxPerMin),
      );
      rs.chip.style.top = `${rs.originalTopPx + shift}px`;
      rs.chip.style.height = `${rs.originalHeightPx - shift}px`;
    }
    if (jsEvent.cancelable) jsEvent.preventDefault();
  };

  const onPointerUp = (jsEvent) => {
    if (!rs) return;
    const r = rs; rs = null;
    r.chip.classList.remove('ec-resizing-y');
    r.chip.classList.remove('ec-resizing');
    if (!r.moved) {
      state.get('fire')?.('eventResizeStop', { event: r.event, jsEvent, view: state.get('view') });
      return;
    }
    const dy = jsEvent.clientY - r.startY;
    const deltaMin = Math.round((dy / r.pxPerMin) / r.snapMins) * r.snapMins;
    const deltaMs = deltaMin * 60_000;

    let newStart = new Date(r.event.start.getTime());
    let newEnd   = new Date(r.event.end.getTime());

    // Multi-day end-resize: if the pointer landed in a DIFFERENT time
    // column than the source, the new end snaps to that column's date
    // + the y-offset's time-of-day. Lets the user drag the bottom edge
    // across multiple days in the week view to extend the event.
    const targetTimeCol = (() => {
      const els = (typeof document !== 'undefined' && document.elementsFromPoint)
        ? document.elementsFromPoint(jsEvent.clientX, jsEvent.clientY) : [];
      for (const el of els) {
        const col = el.closest?.('.ec-time-col');
        if (col && rootEl.contains(col)) return col;
      }
      return null;
    })();
    const sourceTimeCol = r.chip.closest('.ec-time-col');
    const targetDateStr = targetTimeCol?.getAttribute('data-date');
    const sourceDateStr = sourceTimeCol?.getAttribute('data-date');

    if (targetTimeCol && sourceTimeCol && targetDateStr !== sourceDateStr) {
      const options = state.get('options');
      const slotMinMin = totalSecondsOfDuration(options.slotMinTime) / 60 || 0;
      const rect = targetTimeCol.getBoundingClientRect();
      const yIn = jsEvent.clientY - rect.top;
      const minsFromColTop = Math.max(0, Math.round((yIn / r.pxPerMin) / r.snapMins) * r.snapMins);
      const totalMins = minsFromColTop + slotMinMin;
      if (r.handleSide === 'end') {
        newEnd = new Date(targetDateStr + 'T00:00:00Z');
        newEnd.setUTCMinutes(newEnd.getUTCMinutes() + totalMins);
        if (newEnd <= newStart) newEnd = new Date(newStart.getTime() + r.snapMins * 60_000);
      } else {
        newStart = new Date(targetDateStr + 'T00:00:00Z');
        newStart.setUTCMinutes(newStart.getUTCMinutes() + totalMins);
        if (newStart >= newEnd) newStart = new Date(newEnd.getTime() - r.snapMins * 60_000);
      }
    } else if (r.handleSide === 'end') {
      newEnd = new Date(newEnd.getTime() + deltaMs);
      if (newEnd <= newStart) newEnd = new Date(newStart.getTime() + r.snapMins * 60_000);
    } else {
      newStart = new Date(newStart.getTime() + deltaMs);
      if (newStart >= newEnd) newStart = new Date(newEnd.getTime() - r.snapMins * 60_000);
    }

    let reverted = false;
    state.get('fire')?.('eventResizeStop', { event: r.event, jsEvent, view: state.get('view') });
    state.get('fire')?.('eventResize', {
      event: r.event,
      oldEvent: { ...r.event, start: r.event.start, end: r.event.end },
      jsEvent,
      view: state.get('view'),
      endDelta: r.handleSide === 'end'  ? { milliseconds: deltaMs, days: 0 } : { milliseconds: 0, days: 0 },
      startDelta: r.handleSide === 'start' ? { milliseconds: deltaMs, days: 0 } : { milliseconds: 0, days: 0 },
      revert: () => { reverted = true; },
    });
    if (reverted) {
      // Restore the chip's pre-drag geometry (next render re-applies
      // from event data anyway).
      r.chip.style.top = `${r.originalTopPx}px`;
      r.chip.style.height = `${r.originalHeightPx}px`;
      return;
    }
    state.get('hostEl')?.calendarApi?.updateEvent({
      id: r.event.id,
      start: newStart.toISOString(),
      end:   newEnd.toISOString(),
    });
  };

  rootEl.addEventListener('pointerdown', onPointerDown);
  document.addEventListener('pointermove', onPointerMove, { passive: false });
  document.addEventListener('pointerup', onPointerUp);
  document.addEventListener('pointercancel', onPointerUp);

  return () => {
    rootEl.removeEventListener('pointerdown', onPointerDown);
    document.removeEventListener('pointermove', onPointerMove);
    document.removeEventListener('pointerup', onPointerUp);
    document.removeEventListener('pointercancel', onPointerUp);
  };
}

function totalSecondsOfDuration(duration) {
  if (!duration) return 0;
  return (duration.days ?? 0) * 86400 + (duration.seconds ?? 0);
}

function attachDateClickHandler(rootEl, state) {
  const handler = (jsEvent) => {
    const cell = jsEvent.target.closest('[data-date]');
    if (!cell) return;
    // Skip clicks that land on events (those fire eventClick), on a
    // resize handle, or on the more-link / popover controls.
    if (jsEvent.target.closest('[data-event-id], .ec-resizer, [data-more-link], [data-popover-action]')) return;
    const dateStr = cell.getAttribute('data-date');
    const fire = state.get('fire');
    // TimeGrid: derive time-of-day from the click's y-offset within the
    // time column, snapped to snapDuration ?? slotDuration.
    const timeCol = jsEvent.target.closest('.ec-time-col');
    let date, allDay;
    if (timeCol) {
      const options = state.get('options');
      const slotMins = totalSecondsOfDuration(options.slotDuration) / 60 || 30;
      const snapMins = totalSecondsOfDuration(options.snapDuration) / 60 || slotMins;
      const slotHeight = options.slotHeight ?? 22;
      const pxPerMin = slotHeight / slotMins;
      const rect = timeCol.getBoundingClientRect();
      const yIn = jsEvent.clientY - rect.top;
      const slotMinMin = totalSecondsOfDuration(options.slotMinTime) / 60 || 0;
      const minutes = Math.max(0, Math.round((yIn / pxPerMin) / snapMins) * snapMins) + slotMinMin;
      date = new Date(dateStr + 'T00:00:00Z');
      date.setUTCMinutes(date.getUTCMinutes() + minutes);
      allDay = false;
    } else {
      date = new Date(dateStr + 'T00:00:00Z');
      allDay = true;
    }
    fire?.('dateClick', {
      date,
      dateStr: date.toISOString().substring(0, allDay ? 10 : 16),
      allDay,
      jsEvent,
      view: state.get('view'),
    });
  };
  rootEl.addEventListener('click', handler);
  return () => rootEl.removeEventListener('click', handler);
}
