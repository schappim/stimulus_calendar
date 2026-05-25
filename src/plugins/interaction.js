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
        const offClick = attachDateClickHandler(rootEl, state);
        const offDrag  = attachEventDragHandler(rootEl, state);
        return () => { offClick(); offDrag(); };
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
  let drag = null;   // { event, sourceChip, ghost, startX, startY, sourceDateStr }

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

  const onPointerDown = (jsEvent) => {
    const options = state.get('options');
    if (!options.editable && !options.eventStartEditable) return;
    if (jsEvent.button !== undefined && jsEvent.button !== 0) return;
    const chip = findEventChip(jsEvent.target);
    if (!chip) return;
    const id = chip.getAttribute('data-event-id');
    const event = (state.get('filteredEvents') ?? []).find((e) => e.id === id);
    if (!event) return;
    const sourceCell = chip.closest('[data-date]');
    drag = {
      event,
      sourceChip: chip,
      sourceDateStr: sourceCell?.getAttribute('data-date'),
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
      // Build a follow-the-pointer ghost copy of the chip.
      const ghost = drag.sourceChip.cloneNode(true);
      ghost.classList.add(options.theme.ghost ?? 'ec-ghost');
      ghost.style.position = 'fixed';
      ghost.style.pointerEvents = 'none';
      ghost.style.opacity = '0.85';
      ghost.style.zIndex = '1000';
      const rect = drag.sourceChip.getBoundingClientRect();
      ghost.style.width  = `${rect.width}px`;
      ghost.style.height = `${rect.height}px`;
      ghost.style.left = `${rect.left}px`;
      ghost.style.top  = `${rect.top}px`;
      drag.ghost = ghost;
      document.body.appendChild(ghost);
      drag.sourceChip.style.opacity = '0.4';
    }
    if (drag.ghost) {
      drag.ghost.style.left = `${jsEvent.clientX - 20}px`;
      drag.ghost.style.top  = `${jsEvent.clientY - 10}px`;
    }
  };

  const onPointerUp = (jsEvent) => {
    if (!drag) return;
    const d = drag; drag = null;
    if (d.ghost) d.ghost.remove();
    if (d.sourceChip) d.sourceChip.style.opacity = '';
    if (!d.moved) return;     // tap, not a drag

    const targetCell = cellAtPoint(jsEvent.clientX, jsEvent.clientY);
    const targetDateStr = targetCell?.getAttribute('data-date');
    state.get('fire')?.('eventDragStop', {
      event: d.event, jsEvent, view: state.get('view'),
    });
    if (!targetDateStr || targetDateStr === d.sourceDateStr) return;

    // Compute delta as whole-day shift from sourceDateStr → targetDateStr.
    // (Sub-day precision via slot height lands with TimeGrid resize.)
    const dayMs = 86400000;
    const fromMid = new Date(d.sourceDateStr + 'T00:00:00Z').getTime();
    const toMid   = new Date(targetDateStr   + 'T00:00:00Z').getTime();
    const delta   = toMid - fromMid;

    const newStart = new Date(d.event.start.getTime() + delta);
    const newEnd   = new Date(d.event.end.getTime()   + delta);

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
  document.addEventListener('pointermove', onPointerMove);
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

function attachDateClickHandler(rootEl, state) {
  const handler = (jsEvent) => {
    const cell = jsEvent.target.closest('[data-date]');
    if (!cell) return;
    // Skip clicks that land on events (those fire eventClick).
    if (jsEvent.target.closest('[data-event-id]')) return;
    const dateStr = cell.getAttribute('data-date');
    const fire = state.get('fire');
    fire?.('dateClick', {
      date: new Date(dateStr + 'T00:00:00Z'),
      dateStr,
      allDay: true,
      jsEvent,
      view: state.get('view'),
    });
  };
  rootEl.addEventListener('click', handler);
  return () => rootEl.removeEventListener('click', handler);
}
