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
        const offClick    = attachDateClickHandler(rootEl, state);
        const offDrag     = attachEventDragHandler(rootEl, state);
        const offResize   = attachEventResizeHandler(rootEl, state);
        const offCreate   = attachTimeGridCreateHandler(rootEl, state);
        return () => { offClick(); offDrag(); offResize(); offCreate(); };
      },
    });
  },
};

// Attach a delegated click handler that finds the cell under the pointer
// and fires options.dateClick. This is the minimum-viable interaction —
// drag/resize wire up similarly when a mouse/pen down lands on an event
// with data-event-id (and editable is on).
const DEFAULT_EVENT_LONG_PRESS_MS = 240;
const PRESS_MOVE_TOLERANCE = 8;

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
  let drag = null;   // { event, sourceChip, ghost, startX, startY, sourceDateStr, timeCol, touch }
  let press = null;
  const suppressedClicks = new WeakMap();

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
    // On touch devices, ordinary event chips must not trap vertical
    // timeline scrolling or horizontal pager swipes. We still arm a
    // pending drag so the same touch can become a drag immediately after
    // the long-press path marks the chip with .ec-event-editing.
    const isTouch = jsEvent.pointerType === 'touch';
    const id = chip.getAttribute('data-event-id');
    const event = (state.get('filteredEvents') ?? []).find((e) => e.id === id);
    if (!event) return;
    const sourceCell = chip.closest('[data-date]');
    const sourceTimeCol = chip.closest('.ec-time-col');
    // Cache the cursor's offset within the chip at pointerdown so the
    // ghost stays glued to the grab point — moving 1:1 with the cursor
    // for the rest of the drag.
    const sourceColRect = sourceTimeCol?.getBoundingClientRect();
    const chipRect = chip.getBoundingClientRect();
    drag = {
      event,
      sourceChip: chip,
      sourceDateStr: sourceCell?.getAttribute('data-date'),
      sourceTimeCol,
      sourceColRect,
      grabOffsetX: jsEvent.clientX - chipRect.left,
      grabOffsetY: jsEvent.clientY - chipRect.top,
      chipWidth: chipRect.width,
      chipHeight: chipRect.height,
      startX: jsEvent.clientX,
      startY: jsEvent.clientY,
      lastX: jsEvent.clientX,
      lastY: jsEvent.clientY,
      pointerId: jsEvent.pointerId,
      touch: isTouch,
      captured: false,
      ghost: null,
      moved: false,
    };
    // Capture pointer so subsequent move/up land on the same element.
    // For touch, wait until the chip is actually in edit mode; capturing
    // before that would make regular scroll/swipe gestures feel owned by
    // the event.
    if (!isTouch && chip.setPointerCapture && jsEvent.pointerId !== undefined) {
      try { chip.setPointerCapture(jsEvent.pointerId); } catch { /* ignore */ }
      drag.captured = true;
    }
    if (isTouch) {
      addTouchDragListeners();
      armTouchLongPress(jsEvent, chip);
      if (chip.classList.contains('ec-event-editing')) {
        document.body.classList.add('ec-dragging');
      }
    }
  };

  const onPointerMove = (jsEvent) => {
    if (!drag) return;
    if (drag.touch) updateTouchLongPressMove(jsEvent.clientX, jsEvent.clientY);
    updateDragMove(jsEvent, jsEvent.clientX, jsEvent.clientY);
  };

  const onTouchMove = (jsEvent) => {
    if (!drag?.touch) return;
    const touch = activeTouch(jsEvent);
    if (!touch) return;
    updateDragMove(jsEvent, touch.clientX, touch.clientY);
  };

  const onTouchStartCapture = (jsEvent) => {
    const chip = findEventChip(jsEvent.target);
    if (!chip?.classList.contains('ec-event-editing')) return;
    if (jsEvent.cancelable) jsEvent.preventDefault();
    jsEvent.stopPropagation?.();
    jsEvent.stopImmediatePropagation?.();
  };

  function updateDragMove(jsEvent, clientX, clientY) {
    if (!drag) return;
    const touchEditing = drag.touch && drag.sourceChip.classList.contains('ec-event-editing');
    if (touchEditing) {
      // Once the long-press has promoted the chip into edit mode, this
      // contact belongs to the event gesture. Lock page/timeline scroll
      // immediately, even before the drag threshold is crossed.
      if (jsEvent.cancelable) jsEvent.preventDefault();
      jsEvent.stopPropagation?.();
      jsEvent.stopImmediatePropagation?.();
      document.body.classList.add('ec-dragging');
    }
    if (drag.touch && !touchEditing) return;
    drag.lastX = clientX;
    drag.lastY = clientY;
    const dx = clientX - drag.startX;
    const dy = clientY - drag.startY;
    const options = state.get('options');
    const minDist = options.eventDragMinDistance ?? 5;
    if (!drag.moved && (dx * dx + dy * dy) < minDist * minDist) return;
    if (!drag.moved) {
      clearTouchLongPress();
      drag.moved = true;
      if (drag.touch && !drag.captured && drag.sourceChip.setPointerCapture && drag.pointerId !== undefined) {
        try { drag.sourceChip.setPointerCapture(drag.pointerId); drag.captured = true; } catch { /* ignore */ }
      }
      state.get('fire')?.('eventDragStart', {
        event: drag.event, jsEvent, view: state.get('view'),
      });
      // Build a follow-the-pointer ghost copy of the chip. The chip
      // lives under .ec-pager-track, which carries
      // `transform: translate3d(0,0,0)` + `will-change: transform` —
      // both establish a containing block for `position: fixed`
      // descendants. If we append the ghost inside the track, its
      // `fixed` positioning becomes relative to the track, not the
      // viewport — so `left: clientX` ends up offset by the track's
      // viewport position. Append to <body> instead and copy the
      // chip's computed styles inline so the ghost still looks
      // identical without the descendant CSS cascade.
      const ghost = drag.sourceChip.cloneNode(true);
      const cs = getComputedStyle(drag.sourceChip);
      for (let i = 0; i < cs.length; i++) {
        const prop = cs[i];
        ghost.style.setProperty(prop, cs.getPropertyValue(prop), cs.getPropertyPriority(prop));
      }
      ghost.classList.add(options.theme.ghost ?? 'ec-ghost');
      ghost.style.position = 'fixed';
      ghost.style.pointerEvents = 'none';
      ghost.style.opacity = '0.85';
      ghost.style.zIndex = '1000';
      ghost.style.margin = '0';
      ghost.style.right = 'auto';
      ghost.style.bottom = 'auto';
      ghost.style.width  = `${drag.chipWidth}px`;
      ghost.style.height = `${drag.chipHeight}px`;
      ghost.style.left   = `${clientX - drag.grabOffsetX}px`;
      ghost.style.top    = `${clientY - drag.grabOffsetY}px`;
      drag.ghost = ghost;
      document.body.appendChild(ghost);
      drag.sourceChip.style.opacity = '0.4';
      document.body.classList.add('ec-dragging');
    }
    syncVerticalAutoScroll(drag, clientY, () => {
      updateDragMove({
        cancelable: false,
        preventDefault() {},
        stopPropagation() {},
        stopImmediatePropagation() {},
      }, drag.lastX, drag.lastY);
    });
    if (drag.ghost) {
      // 1:1 cursor following — the grab offset (where on the chip the
      // user grabbed) stays fixed for the duration of the drag, so the
      // ghost feels glued to the cursor. The drop logic in onPointerUp
      // still snaps to slot + day; only the preview is free-form.
      drag.ghost.style.left = `${clientX - drag.grabOffsetX}px`;
      drag.ghost.style.top  = `${clientY - drag.grabOffsetY}px`;
    }
    // Preventing default while actively dragging stops the browser from
    // hijacking touch gestures (e.g. iOS swipe-back, page rubber-band).
    if (jsEvent.cancelable) jsEvent.preventDefault();
  }

  const onPointerUp = (jsEvent) => {
    if (drag?.touch && jsEvent.type === 'pointercancel') return;
    finishDrag(jsEvent, jsEvent.clientX, jsEvent.clientY);
  };

  const onTouchEnd = (jsEvent) => {
    if (!drag?.touch) return;
    const touch = activeChangedTouch(jsEvent);
    finishDrag(jsEvent, touch?.clientX ?? drag.lastX, touch?.clientY ?? drag.lastY);
  };

  function finishDrag(jsEvent, clientX, clientY) {
    if (!drag) return;
    const d = drag; drag = null;
    clearTouchLongPress();
    removeTouchDragListeners();
    stopVerticalAutoScroll(d);
    document.body.classList.remove('ec-dragging');
    if (d.ghost) d.ghost.remove();
    if (d.sourceChip) d.sourceChip.style.opacity = '';
    if (!d.moved) return;     // tap, not a drag

    const targetCell = cellAtPoint(clientX, clientY);
    const targetDateStr = targetCell?.getAttribute('data-date');
    const targetTimeCol = timeColAtPoint(clientX, clientY);
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
      const yInTargetCol = clientY - colRect.top;
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
  }

  let touchDragListening = false;
  function addTouchDragListeners() {
    if (touchDragListening) return;
    touchDragListening = true;
    document.addEventListener('touchmove', onTouchMove, { passive: false, capture: true });
    document.addEventListener('touchend', onTouchEnd, { passive: false, capture: true });
    document.addEventListener('touchcancel', onTouchEnd, { passive: false, capture: true });
  }

  function removeTouchDragListeners() {
    if (!touchDragListening) return;
    touchDragListening = false;
    document.removeEventListener('touchmove', onTouchMove, true);
    document.removeEventListener('touchend', onTouchEnd, true);
    document.removeEventListener('touchcancel', onTouchEnd, true);
  }

  function armTouchLongPress(jsEvent, chip) {
    clearTouchLongPress();
    const options = state.get('options');
    const delay = options.eventLongPressDelay ?? DEFAULT_EVENT_LONG_PRESS_MS;
    press = {
      chip,
      startX: jsEvent.clientX,
      startY: jsEvent.clientY,
      moved: false,
      timer: setTimeout(() => {
        if (!press || press.chip !== chip || press.moved || !drag || drag.sourceChip !== chip) return;
        press = null;
        enterEditMode(chip);
        suppressChipClick(chip);
        document.body.classList.add('ec-dragging');
        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(15);
      }, delay),
    };
  }

  function clearTouchLongPress() {
    if (!press) return;
    clearTimeout(press.timer);
    press = null;
  }

  function updateTouchLongPressMove(clientX, clientY) {
    if (!press) return;
    const dx = clientX - press.startX;
    const dy = clientY - press.startY;
    if (dx * dx + dy * dy > PRESS_MOVE_TOLERANCE * PRESS_MOVE_TOLERANCE) {
      press.moved = true;
      clearTouchLongPress();
    }
  }

  function enterEditMode(chip) {
    rootEl.querySelectorAll?.('.ec-event.ec-event-editing')
      .forEach((el) => { if (el !== chip) el.classList.remove('ec-event-editing'); });
    chip.classList.add('ec-event-editing');
  }

  function suppressChipClick(chip) {
    suppressedClicks.set(chip, Date.now() + 800);
  }

  function onClickCapture(jsEvent) {
    const chip = findEventChip(jsEvent.target);
    if (!chip) return;
    const until = suppressedClicks.get(chip) || 0;
    if (until && Date.now() <= until) {
      jsEvent.preventDefault();
      jsEvent.stopImmediatePropagation?.();
      jsEvent.stopPropagation?.();
      return;
    }
    if (until) suppressedClicks.delete(chip);
  }

  function activeTouch(jsEvent) {
    const touch = jsEvent.touches?.[0] ?? null;
    if (touch) updateTouchLongPressMove(touch.clientX, touch.clientY);
    return jsEvent.touches?.[0] ?? null;
  }

  function activeChangedTouch(jsEvent) {
    return jsEvent.changedTouches?.[0] ?? null;
  }

  rootEl.addEventListener('pointerdown', onPointerDown);
  rootEl.addEventListener('touchstart', onTouchStartCapture, { passive: false, capture: true });
  rootEl.addEventListener('click', onClickCapture, true);
  document.addEventListener('pointermove', onPointerMove, { passive: false });
  document.addEventListener('pointerup',   onPointerUp);
  document.addEventListener('pointercancel', onPointerUp);

  return () => {
    rootEl.removeEventListener('pointerdown', onPointerDown);
    rootEl.removeEventListener('touchstart', onTouchStartCapture, true);
    rootEl.removeEventListener('click', onClickCapture, true);
    document.removeEventListener('pointermove', onPointerMove);
    document.removeEventListener('pointerup',   onPointerUp);
    document.removeEventListener('pointercancel', onPointerUp);
    removeTouchDragListeners();
    clearTouchLongPress();
    if (drag?.ghost) drag.ghost.remove();
    stopVerticalAutoScroll(drag);
  };
}

function syncVerticalAutoScroll(gesture, clientY, onScroll) {
  const scrollEl = gesture.scrollEl
    ?? gesture.sourceChip?.closest?.('[data-row="body"]')
    ?? gesture.chip?.closest?.('[data-row="body"]')
    ?? null;
  if (!scrollEl) return;
  gesture.scrollEl = scrollEl;

  const rect = scrollEl.getBoundingClientRect();
  const edge = 36;
  const maxSpeed = 14;
  let speed = 0;
  if (clientY < rect.top + edge) {
    const depth = Math.min(1, (rect.top + edge - clientY) / edge);
    speed = -Math.max(2, Math.round(depth * maxSpeed));
  } else if (clientY > rect.bottom - edge) {
    const depth = Math.min(1, (clientY - (rect.bottom - edge)) / edge);
    speed = Math.max(2, Math.round(depth * maxSpeed));
  }
  gesture.autoScrollSpeed = speed;
  if (!speed || gesture.autoScrollRaf) return;

  const tick = () => {
    if (!gesture.autoScrollSpeed || !gesture.scrollEl) {
      gesture.autoScrollRaf = null;
      return;
    }
    const el = gesture.scrollEl;
    const before = el.scrollTop;
    const max = Math.max(0, el.scrollHeight - el.clientHeight);
    const next = Math.max(0, Math.min(max, before + gesture.autoScrollSpeed));
    el.scrollTop = next;
    const delta = next - before;
    if (delta) {
      gesture.startY -= delta;
      onScroll?.(delta);
    }
    gesture.autoScrollRaf = requestAnimationFrame(tick);
  };
  gesture.autoScrollRaf = requestAnimationFrame(tick);
}

function stopVerticalAutoScroll(gesture) {
  if (!gesture) return;
  if (gesture.autoScrollRaf) cancelAnimationFrame(gesture.autoScrollRaf);
  gesture.autoScrollRaf = null;
  gesture.autoScrollSpeed = 0;
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
    const isTouch = jsEvent.pointerType === 'touch';
    if (isTouch && !chip.classList.contains('ec-event-editing')) return;
    const id = chip.getAttribute('data-event-id');
    const event = (state.get('filteredEvents') ?? []).find((e) => e.id === id);
    if (!event) return;
    const slotMins = totalSecondsOfDuration(options.slotDuration) / 60 || 30;
    const snapMins = totalSecondsOfDuration(options.snapDuration) / 60 || slotMins;
    const pxPerMin = (options.slotHeight ?? 22) / slotMins;
    // Every segment of the same event (chips share data-event-id across
    // day columns for multi-day timed events). Captured here so the
    // shrink-back branch can hide / truncate / restore each segment.
    const segmentEls = Array.from(rootEl.querySelectorAll(`[data-event-id="${typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(id) : id}"]`));
    const segments = segmentEls.map((el) => {
      const col = el.closest('.ec-time-col');
      if (!col) return null;
      return {
        el,
        col,
        originalTop: parseFloat(el.style.top || '0') || 0,
        originalHeight: parseFloat(el.style.height || '0') || el.getBoundingClientRect().height,
        originalDisplay: el.style.display || '',
      };
    }).filter(Boolean);

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
      sourceCol: chip.closest('.ec-time-col'),
      previewChips: [],
      segments,
      touch: isTouch,
      pointerId: jsEvent.pointerId,
      lastX: jsEvent.clientX,
      lastY: jsEvent.clientY,
    };
    chip.classList.add('ec-resizing-y');
    chip.classList.add('ec-resizing');
    // Body class so the resize cursor sticks even when the pointer
    // wanders off the chip onto another segment of the same event.
    document.body.classList.add('ec-resizing-active');
    if (handle.setPointerCapture && jsEvent.pointerId !== undefined) {
      try { handle.setPointerCapture(jsEvent.pointerId); } catch { /* ignore */ }
    }
    if (isTouch) addTouchResizeListeners();
    state.get('fire')?.('eventResizeStart', { event, jsEvent, view: state.get('view') });
    if (jsEvent.cancelable) jsEvent.preventDefault();
    jsEvent.stopPropagation();
  };

  const onPointerMove = (jsEvent) => {
    if (!rs) return;
    updateResizeMove(jsEvent, jsEvent.clientX, jsEvent.clientY);
  };

  const onTouchMove = (jsEvent) => {
    if (!rs?.touch) return;
    const touch = activeResizeTouch(jsEvent);
    if (!touch) return;
    if (jsEvent.cancelable) jsEvent.preventDefault();
    jsEvent.stopPropagation?.();
    jsEvent.stopImmediatePropagation?.();
    updateResizeMove(jsEvent, touch.clientX, touch.clientY);
  };

  function updateResizeMove(jsEvent, clientX, clientY) {
    if (!rs) return;
    rs.lastX = clientX;
    rs.lastY = clientY;
    const dy = clientY - rs.startY;
    const deltaMin = Math.round((dy / rs.pxPerMin) / rs.snapMins) * rs.snapMins;
    if (deltaMin !== 0) rs.moved = true;

    // Detect the time-col currently under the pointer.
    let targetCol = null;
    const els = (typeof document !== 'undefined' && document.elementsFromPoint)
      ? document.elementsFromPoint(clientX, clientY) : [];
    for (const el of els) {
      const col = el.closest?.('.ec-time-col');
      if (col && rootEl.contains(col)) { targetCol = col; break; }
    }

    // Clear preview chips and reset every event-segment's geometry on
    // each move. The branches below re-apply only the mutations they
    // need; this keeps state clean when the user goes forward then
    // back (or back then forward) without sticky height/display.
    for (const p of rs.previewChips) p.remove();
    rs.previewChips = [];
    for (const seg of rs.segments) {
      seg.el.style.display = seg.originalDisplay;
      seg.el.style.top = `${seg.originalTop}px`;
      seg.el.style.height = `${seg.originalHeight}px`;
    }

    const colsWrap = rs.sourceCol?.parentElement;
    const cols = colsWrap
      ? Array.from(colsWrap.children).filter((c) => c.classList?.contains('ec-time-col'))
      : [];
    const sourceIdx = rs.sourceCol ? cols.indexOf(rs.sourceCol) : -1;
    const targetIdx = targetCol ? cols.indexOf(targetCol) : -1;

    if (rs.handleSide === 'end' && targetIdx >= 0 && sourceIdx >= 0 && targetIdx < sourceIdx) {
      // SHRINK BACK: the pointer moved into an earlier day-column than
      // the segment whose handle the user grabbed. Hide every segment
      // past the target column, truncate the segment in the target
      // column at the cursor's snapped y-offset (clamped to a one-snap
      // minimum so the event never collapses below 1 increment), and
      // leave earlier segments at their original geometry.
      for (const seg of rs.segments) {
        const segIdx = cols.indexOf(seg.col);
        if (segIdx < 0 || segIdx < targetIdx) continue; // earlier — already restored
        if (segIdx > targetIdx) {
          seg.el.style.display = 'none';
        } else {
          const rect = targetCol.getBoundingClientRect();
          const yIn = clientY - rect.top;
          const snappedY = Math.round((yIn / rs.pxPerMin) / rs.snapMins) * rs.snapMins * rs.pxPerMin;
          const minBottom = seg.originalTop + rs.snapMins * rs.pxPerMin;
          const newBottom = Math.max(minBottom, snappedY);
          seg.el.style.height = `${newBottom - seg.originalTop}px`;
        }
      }
    } else if (rs.handleSide === 'end' && targetCol && rs.sourceCol && targetCol !== rs.sourceCol) {
      // Multi-day stretch FORWARD: cap source chip at end of its day,
      // paint a preview chip in every intermediate day column
      // (full height) and one in the target column from top to the
      // pointer (snapped). Lets the user see exactly how far the
      // event will extend before they release.
      const sourceColH = rs.sourceCol.getBoundingClientRect().height;
      rs.chip.style.height = `${Math.max(rs.snapMins * rs.pxPerMin, sourceColH - rs.originalTopPx - 2)}px`;

      if (sourceIdx >= 0 && targetIdx > sourceIdx) {
        for (let i = sourceIdx + 1; i < targetIdx; ++i) {
          rs.previewChips.push(makePreview(cols[i], 0, cols[i].getBoundingClientRect().height - 2, rs));
        }
        const rect = targetCol.getBoundingClientRect();
        const yIn = Math.max(rs.snapMins * rs.pxPerMin,
          Math.round(((clientY - rect.top) / rs.pxPerMin) / rs.snapMins) * rs.snapMins * rs.pxPerMin);
        rs.previewChips.push(makePreview(targetCol, 0, yIn, rs));
      }
    } else if (rs.handleSide === 'end') {
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
    syncVerticalAutoScroll(rs, clientY, () => {
      updateResizeMove({
        cancelable: false,
        preventDefault() {},
        stopPropagation() {},
        stopImmediatePropagation() {},
      }, rs.lastX, rs.lastY);
    });
    if (jsEvent.cancelable) jsEvent.preventDefault();
  }

  // Build a translucent preview chip that mirrors the source chip's
  // styling, anchored to the given column at top..top+height.
  function makePreview(col, topPx, heightPx, r) {
    const clone = r.chip.cloneNode(true);
    // Strip the resize handles so the user can't grab them on the preview.
    clone.querySelectorAll('.ec-resizer').forEach((n) => n.remove());
    clone.classList.add('ec-event-preview');
    clone.style.position = 'absolute';
    clone.style.top = `${topPx}px`;
    clone.style.height = `${heightPx}px`;
    clone.style.left = '0';
    clone.style.right = '0';
    clone.style.opacity = '0.6';
    clone.style.pointerEvents = 'none';
    // Use the column's event overlay (.ec-event-overlay) if present so
    // the preview lives in the same positioned context as real chips.
    const overlay = col.querySelector('.ec-event-overlay') ?? col;
    overlay.appendChild(clone);
    return clone;
  }

  const onPointerUp = (jsEvent) => {
    if (rs?.touch && jsEvent.type === 'pointercancel') return;
    finishResize(jsEvent, jsEvent.clientX, jsEvent.clientY);
  };

  const onTouchEnd = (jsEvent) => {
    if (!rs?.touch) return;
    const touch = activeChangedResizeTouch(jsEvent);
    if (jsEvent.cancelable) jsEvent.preventDefault();
    jsEvent.stopPropagation?.();
    jsEvent.stopImmediatePropagation?.();
    finishResize(jsEvent, touch?.clientX ?? rs.lastX, touch?.clientY ?? rs.lastY);
  };

  function finishResize(jsEvent, clientX, clientY) {
    if (!rs) return;
    const r = rs; rs = null;
    removeTouchResizeListeners();
    stopVerticalAutoScroll(r);
    r.chip.classList.remove('ec-resizing-y');
    r.chip.classList.remove('ec-resizing');
    document.body.classList.remove('ec-resizing-active');
    // Tear down any preview chips painted during the multi-day stretch.
    for (const p of r.previewChips) p.remove();
    r.previewChips = [];
    if (!r.moved) {
      // Restore every segment back to its pre-drag geometry — a tap on
      // the handle without movement shouldn't leave any preview state
      // behind. (After a real commit, the next render replaces the DOM
      // anyway, so this matters only for the no-op path.)
      for (const seg of r.segments) {
        seg.el.style.display = seg.originalDisplay;
        seg.el.style.top = `${seg.originalTop}px`;
        seg.el.style.height = `${seg.originalHeight}px`;
      }
      state.get('fire')?.('eventResizeStop', { event: r.event, jsEvent, view: state.get('view') });
      return;
    }
    const dy = clientY - r.startY;
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
        ? document.elementsFromPoint(clientX, clientY) : [];
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
      const yIn = clientY - rect.top;
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
      // Restore every segment's pre-drag geometry (next render
      // re-applies from event data anyway, but the cancel path doesn't
      // re-render).
      for (const seg of r.segments) {
        seg.el.style.display = seg.originalDisplay;
        seg.el.style.top = `${seg.originalTop}px`;
        seg.el.style.height = `${seg.originalHeight}px`;
      }
      return;
    }
    state.get('hostEl')?.calendarApi?.updateEvent({
      id: r.event.id,
      start: newStart.toISOString(),
      end:   newEnd.toISOString(),
    });
  }

  let touchResizeListening = false;
  function addTouchResizeListeners() {
    if (touchResizeListening) return;
    touchResizeListening = true;
    document.addEventListener('touchmove', onTouchMove, { passive: false, capture: true });
    document.addEventListener('touchend', onTouchEnd, { passive: false, capture: true });
    document.addEventListener('touchcancel', onTouchEnd, { passive: false, capture: true });
  }

  function removeTouchResizeListeners() {
    if (!touchResizeListening) return;
    touchResizeListening = false;
    document.removeEventListener('touchmove', onTouchMove, true);
    document.removeEventListener('touchend', onTouchEnd, true);
    document.removeEventListener('touchcancel', onTouchEnd, true);
  }

  function activeResizeTouch(jsEvent) {
    return jsEvent.touches?.[0] ?? null;
  }

  function activeChangedResizeTouch(jsEvent) {
    return jsEvent.changedTouches?.[0] ?? null;
  }

  rootEl.addEventListener('pointerdown', onPointerDown);
  document.addEventListener('pointermove', onPointerMove, { passive: false });
  document.addEventListener('pointerup', onPointerUp);
  document.addEventListener('pointercancel', onPointerUp);

  return () => {
    rootEl.removeEventListener('pointerdown', onPointerDown);
    document.removeEventListener('pointermove', onPointerMove);
    document.removeEventListener('pointerup', onPointerUp);
    document.removeEventListener('pointercancel', onPointerUp);
    removeTouchResizeListeners();
    stopVerticalAutoScroll(rs);
  };
}

function totalSecondsOfDuration(duration) {
  if (!duration) return 0;
  return (duration.days ?? 0) * 86400 + (duration.seconds ?? 0);
}

// Drag-to-create on TimeGrid: pointerdown on an empty time slot,
// drag (across days too), pointerup → fires dateClick with start/end
// representing the dragged range so the host can prompt + addEvent.
// Mirrors macOS Calendar. Preview chips paint in every day-column
// the range touches.
function attachTimeGridCreateHandler(rootEl, state) {
  let drag = null;

  function colsContainer(col) {
    return col.parentElement;
  }
  function allTimeCols(col) {
    const wrap = colsContainer(col);
    if (!wrap) return [col];
    return Array.from(wrap.children).filter((c) => c.classList?.contains('ec-time-col'));
  }
  function colAtPoint(x, y) {
    const els = (typeof document !== 'undefined' && document.elementsFromPoint)
      ? document.elementsFromPoint(x, y) : [];
    for (const el of els) {
      const col = el.closest?.('.ec-time-col');
      if (col && rootEl.contains(col)) return col;
    }
    return null;
  }
  function makePreview(col) {
    const options = state.get('options');
    const theme = options.theme;
    const preview = document.createElement('div');
    preview.className = `${theme.event ?? 'ec-event'} ec-event-preview`;
    preview.style.position = 'absolute';
    preview.style.left = '0';
    preview.style.right = '0';
    preview.style.opacity = '0.7';
    preview.style.pointerEvents = 'none';
    preview.style.background = options.eventBackgroundColor ?? '#2563eb';
    preview.style.color = '#ffffff';
    preview.style.borderRadius = '3px';
    preview.style.padding = '2px 0.375rem';
    preview.style.fontSize = '0.72rem';
    preview.style.overflow = 'hidden';
    const overlay = col.querySelector('.ec-event-overlay') ?? col;
    overlay.appendChild(preview);
    return preview;
  }

  function onPointerDown(jsEvent) {
    const options = state.get('options');
    if (!options.editable) return;
    if (jsEvent.button !== undefined && jsEvent.button !== 0) return;
    // Touch: skip. Drag-to-create is a desktop convention — on a phone
    // the same finger motion is used for vertical scroll (timeline) and
    // horizontal swipe (page navigation). PreventDefaulting on pointerdown
    // here would kill those native gestures, and any movement during the
    // gesture would otherwise tip drag.moved to true and surface a create
    // sheet that the user never asked for. Host apps build mobile create
    // flows around long-press instead (see demo/18-mobile.html). The
    // pager already uses the mirror-image rule (skips mouse, accepts
    // touch); this keeps the two gesture sources mutually exclusive on
    // each platform.
    if (jsEvent.pointerType === 'touch') return;
    if (jsEvent.target.closest?.('[data-event-id], .ec-resizer, .ec-button, button, input, select, textarea, a, [data-more-link], [data-popover-action]')) return;
    const col = jsEvent.target.closest?.('.ec-time-col');
    if (!col || !rootEl.contains(col)) return;
    const dateStr = col.getAttribute('data-date');
    if (!dateStr) return;
    const slotMins = totalSecondsOfDuration(options.slotDuration) / 60 || 30;
    const snapMins = totalSecondsOfDuration(options.snapDuration) / 60 || slotMins;
    const pxPerMin = (options.slotHeight ?? 22) / slotMins;
    const slotMinMin = totalSecondsOfDuration(options.slotMinTime) / 60 || 0;
    const rect = col.getBoundingClientRect();
    const yIn = jsEvent.clientY - rect.top;
    const minsFromTop = Math.max(0, Math.round((yIn / pxPerMin) / snapMins) * snapMins);
    drag = {
      sourceCol: col,
      sourceDateStr: dateStr,
      sourceMinFromTop: minsFromTop,
      slotMins, snapMins, pxPerMin, slotMinMin,
      previewChips: [],
      moved: false,
    };
    if (jsEvent.cancelable) jsEvent.preventDefault();
    document.addEventListener('pointermove', onPointerMove, { passive: false });
    document.addEventListener('pointerup', onPointerUp);
    document.addEventListener('pointercancel', onPointerUp);
  }

  // Computes the current pointer's [col, minsFromTop] state from a
  // pointermove/up event.
  function pointerAt(jsEvent, d) {
    const targetCol = colAtPoint(jsEvent.clientX, jsEvent.clientY) ?? d.sourceCol;
    const rect = targetCol.getBoundingClientRect();
    const yIn = jsEvent.clientY - rect.top;
    const mins = Math.max(0, Math.round((yIn / d.pxPerMin) / d.snapMins) * d.snapMins);
    return { col: targetCol, mins };
  }

  function clearPreview(d) {
    for (const p of d.previewChips) p.remove();
    d.previewChips = [];
  }

  function renderPreview(d, p) {
    clearPreview(d);
    const cols = allTimeCols(d.sourceCol);
    const sourceIdx = cols.indexOf(d.sourceCol);
    const targetIdx = cols.indexOf(p.col);
    if (sourceIdx < 0 || targetIdx < 0) return;
    const forward = targetIdx >= sourceIdx;
    const lo = Math.min(sourceIdx, targetIdx);
    const hi = Math.max(sourceIdx, targetIdx);

    // For each column the range touches, paint a chip from topMin..bottomMin.
    for (let i = lo; i <= hi; ++i) {
      const col = cols[i];
      const colH = col.getBoundingClientRect().height;
      let topMin, bottomMin;
      if (sourceIdx === targetIdx) {
        // Single column: just the dragged range.
        topMin = Math.min(d.sourceMinFromTop, p.mins);
        bottomMin = Math.max(d.sourceMinFromTop, p.mins);
        bottomMin = Math.max(bottomMin, topMin + d.snapMins);
      } else if (forward) {
        // Forward drag (later days): source's column from sourceMin → end;
        // intermediates: full; target: top → p.mins.
        if (i === sourceIdx) { topMin = d.sourceMinFromTop; bottomMin = colH / d.pxPerMin; }
        else if (i === targetIdx) { topMin = 0; bottomMin = Math.max(d.snapMins, p.mins); }
        else { topMin = 0; bottomMin = colH / d.pxPerMin; }
      } else {
        // Backward drag (earlier days): target from p.mins → end;
        // intermediates: full; source: top → sourceMin.
        if (i === sourceIdx) { topMin = 0; bottomMin = Math.max(d.snapMins, d.sourceMinFromTop); }
        else if (i === targetIdx) { topMin = p.mins; bottomMin = colH / d.pxPerMin; }
        else { topMin = 0; bottomMin = colH / d.pxPerMin; }
      }
      const span = Math.max(d.snapMins, bottomMin - topMin);
      const preview = makePreview(col);
      preview.style.top = `${topMin * d.pxPerMin}px`;
      preview.style.height = `${span * d.pxPerMin}px`;
      // Label only on the first column of the range — keeps it readable.
      if (i === lo) {
        const startMin = forward ? d.sourceMinFromTop : p.mins;
        const endMin   = forward ? p.mins : d.sourceMinFromTop;
        preview.textContent = `${fmtMins(startMin + d.slotMinMin)} – ${fmtMins((endMin || 24*60) + d.slotMinMin)}`;
      }
      d.previewChips.push(preview);
    }
  }

  function onPointerMove(jsEvent) {
    if (!drag) return;
    const dy = jsEvent.clientY - (drag.previewChips[0] ? jsEvent.clientY : jsEvent.clientY); // no-op
    const dist = Math.abs(jsEvent.clientY - (drag.sourceCol.getBoundingClientRect().top + drag.sourceMinFromTop * drag.pxPerMin));
    if (!drag.moved && dist < 4 && drag.previewChips.length === 0) {
      // Wait for a meaningful movement before painting.
    }
    drag.moved = true;
    const p = pointerAt(jsEvent, drag);
    renderPreview(drag, p);
    if (jsEvent.cancelable) jsEvent.preventDefault();
  }

  function onPointerUp(jsEvent) {
    if (!drag) return;
    const d = drag; drag = null;
    document.removeEventListener('pointermove', onPointerMove);
    document.removeEventListener('pointerup', onPointerUp);
    document.removeEventListener('pointercancel', onPointerUp);
    clearPreview(d);
    if (!d.moved) return;

    const p = pointerAt(jsEvent, d);
    const sameCol = p.col === d.sourceCol;
    const targetDateStr = p.col.getAttribute('data-date');
    const sourceStart = new Date(d.sourceDateStr + 'T00:00:00Z');
    sourceStart.setUTCMinutes(sourceStart.getUTCMinutes() + d.sourceMinFromTop + d.slotMinMin);
    const targetStart = new Date(targetDateStr + 'T00:00:00Z');
    targetStart.setUTCMinutes(targetStart.getUTCMinutes() + p.mins + d.slotMinMin);
    // Order so start < end (handles drag backwards).
    let start = sourceStart, end = targetStart;
    if (sameCol) {
      const a = Math.min(d.sourceMinFromTop, p.mins);
      const b = Math.max(d.sourceMinFromTop, p.mins);
      start = new Date(d.sourceDateStr + 'T00:00:00Z');
      start.setUTCMinutes(start.getUTCMinutes() + a + d.slotMinMin);
      end = new Date(d.sourceDateStr + 'T00:00:00Z');
      end.setUTCMinutes(end.getUTCMinutes() + Math.max(b, a + d.snapMins) + d.slotMinMin);
    } else if (start > end) {
      [start, end] = [end, start];
    }
    state.get('fire')?.('dateClick', {
      date: start,
      dateStr: start.toISOString().substring(0, 10),
      allDay: false,
      end,
      jsEvent,
      view: state.get('view'),
    });
  }

  rootEl.addEventListener('pointerdown', onPointerDown);
  return () => {
    rootEl.removeEventListener('pointerdown', onPointerDown);
    document.removeEventListener('pointermove', onPointerMove);
    document.removeEventListener('pointerup', onPointerUp);
    document.removeEventListener('pointercancel', onPointerUp);
  };
}

function fmtMins(totalMins) {
  const h = Math.floor(totalMins / 60) % 24;
  const m = Math.floor(totalMins) % 60;
  const h12 = (h % 12) || 12;
  const period = h >= 12 ? 'pm' : 'am';
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
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
