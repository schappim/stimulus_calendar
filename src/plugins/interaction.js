// Interaction plugin — pointer-driven editing: dateClick, drag/drop,
// resize, range selection. Mirrors the upstream Interaction plugin's
// option surface; pointer geometry is wired via the per-view DOM
// listeners (DayGrid month cells emit dateClick; TimeGrid event chips
// emit drag/resize). Selection rendering is minimal (highlight class
// on selected cells).

import { armChipClickSuppression } from '../lib/click_suppression.js';
import { eventMetaSeriesInfo } from '../lib/event_meta.js';

// Wraps the optional confirmEventChange dance around a synchronous
// updateEvent commit. When the event is a series member and an
// options.confirmEventChange callback is configured, the commit is
// deferred until the callback resolves (or rejects). On resolution
// with `{ proceed: true }` we commit + fire `eventChangeConfirmed`;
// on anything else we discard. Non-series events skip the hook and
// commit synchronously, preserving today's behaviour exactly.
function maybeCommitWithConfirm({ state, options, event, kind, detailExtras, updateAttrs }) {
  const series = eventMetaSeriesInfo(event);
  const confirmFn = options.confirmEventChange;
  if (typeof confirmFn === 'function' && series.isSeriesMember) {
    Promise.resolve(confirmFn({
      kind, event,
      oldEvent: detailExtras?.oldEvent,
      delta: detailExtras?.delta,
      startDelta: detailExtras?.startDelta,
      endDelta: detailExtras?.endDelta,
      isOccurrence: true,
      seriesId: series.seriesId,
    })).then((result) => {
      if (!result || result.proceed === false) return;
      state.get('hostEl')?.calendarApi?.updateEvent(updateAttrs);
      state.get('fire')?.('eventChangeConfirmed', {
        event, kind,
        scope: result.scope ?? null,
        seriesId: series.seriesId,
      });
    });
    return;
  }
  state.get('hostEl')?.calendarApi?.updateEvent(updateAttrs);
}

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
        const offTimeline = attachTimelineBarHandler(rootEl, state);
        const offSelect   = attachRangeSelectHandler(rootEl, state);
        return () => { offClick(); offDrag(); offResize(); offCreate(); offTimeline(); offSelect(); };
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

// Edge-hold cross-day drag (mobile single-day TimeGrid views). Once a
// chip is in edit mode and the finger drags into the left/right
// edge band of the pager's viewport, the pager auto-steps to the
// adjacent day after a hold; staying parked at the edge keeps stepping
// at a faster cadence. Mirrors mobile_schedule_controller.js so users
// get the same gesture across the desktop calendar and the mobile
// schedule UI.
const DAY_DRAG_EDGE_ZONE_RATIO = 0.18;
const DAY_DRAG_EDGE_ZONE_MIN_PX = 72;
const DAY_DRAG_EDGE_ZONE_MAX_PX = 120;
// Intentionally slow on first entry — a glancing brush of the edge
// shouldn't snap to the next day. Subsequent steps run at the fast
// cadence so a committed user can race through several days.
const DAY_DRAG_EDGE_HOLD_INITIAL_MS = 850;
const DAY_DRAG_EDGE_HOLD_MS = 375;
const DAY_DRAG_HAPTIC_MS = 8;
// One short selection-style haptic on every wall-clock snap-step
// crossing, so the user feels the 15-min grid even with eyes off the
// screen. The day-step haptic takes precedence when both fire in the
// same frame to avoid a double-tap. iOS doesn't honor navigator.vibrate,
// but on Android Chrome this is the standard way to surface a selection
// click.
const SNAP_HAPTIC_MS = 5;

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
    // Capture where on the source day-column the grab landed, in
    // minutes-from-col-top. Snapshotting this once at pointerdown keeps
    // finishDrag working even after a cross-day edge-hold has torn down
    // the source column's DOM during a day-step.
    const slotMins = totalSecondsOfDuration(options.slotDuration) / 60 || 30;
    const slotHeight = options.slotHeight ?? 22;
    const pxPerMin = slotHeight / slotMins;
    const snapMins = totalSecondsOfDuration(options.snapDuration) / 60 || slotMins;
    const slotMinMin = totalSecondsOfDuration(options.slotMinTime) / 60 || 0;
    const startTimeOfDayMin = sourceColRect
      ? (jsEvent.clientY - sourceColRect.top) / pxPerMin
      : null;
    // Wall-clock minutes-since-midnight for the event the user grabbed.
    // The snap is applied to (originalStartMin + cursorDeltaMin), so the
    // moving chip always re-aligns to the 00 / 15 / 30 / 45 grid as the
    // finger drags — regardless of where the event originally started
    // (a 09:07 event becomes 09:00, 09:15, 09:30 as you drag, not 09:07,
    // 09:22, 09:37). UTC accessors because event.start is the
    // calendar's UTC-encoded wall-clock representation.
    const originalStartMin = event.start.getUTCHours() * 60 + event.start.getUTCMinutes();
    const originalEndMin = event.end.getUTCHours() * 60 + event.end.getUTCMinutes()
      + (event.end.getTime() < event.start.getTime() ? 24 * 60 : 0);
    drag = {
      event,
      sourceChip: chip,
      sourceDateStr: sourceCell?.getAttribute('data-date'),
      sourceTimeCol,
      sourceColRect,
      startTimeOfDayMin,
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
      // Vertical snap baseline. snapMins is captured once at pointerdown
      // (rather than re-read every frame) so changing options mid-drag
      // doesn't move the goalposts. lastSnappedStartMin starts at null
      // and is set on the first move; the haptic fires whenever it
      // changes between move frames.
      pxPerMin,
      snapMins,
      slotMinMin,
      originalStartMin,
      originalEndMin,
      lastSnappedStartMin: null,
      timeTextHidden: false,
      // Edge-hold cross-day drag bookkeeping.
      edgeHoldTimer: null,
      edgeHoldDirection: 0,
      edgeHoldFirstFired: false,
      swapping: false,
      daySteps: 0,
      dayOffsetBadge: null,
      pointerCancelWatchdog: null,
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
      // For touch we deliberately skip setPointerCapture — the
      // document-level pointer + touch listeners already see every
      // event, and capturing on the chip backfires once a cross-day
      // edge-hold step tears the chip out of the DOM: iOS Safari then
      // fires pointercancel (capture loss) without a follow-up
      // touchend, leaving the gesture stuck. Touch scroll suppression
      // is already covered by preventDefault on the move events + the
      // body.ec-dragging touch-action override.
      if (!drag.touch && drag.sourceChip.setPointerCapture && drag.pointerId !== undefined) {
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
      // The chip's own time-of-day text is now stale — the user is
      // dragging it to a new time, but the text would keep showing the
      // original. Hide it on both the source chip and the ghost so the
      // floating gutter label is the only authoritative read of the
      // proposed snap.
      hideEventTimeText(drag);
    }
    // Wall-clock vertical snap — round (originalStartMin + cursorDeltaMin)
    // to the nearest snapMins so the ghost lands on the 00 / 15 / 30 / 45
    // grid (anchored to the day's wall clock, not the original event
    // time). Between snap boundaries the ghost holds position — the
    // finger moves but the tile doesn't, which is the primary visual
    // confirmation that snapping happened.
    const cursorDeltaMin = (clientY - drag.startY) / drag.pxPerMin;
    const proposedStartMin = drag.originalStartMin + cursorDeltaMin;
    const snappedStartMin = Math.round(proposedStartMin / drag.snapMins) * drag.snapMins;
    const snappedDeltaMin = snappedStartMin - drag.originalStartMin;
    const snappedDeltaY = snappedDeltaMin * drag.pxPerMin;
    syncVerticalAutoScroll(drag, clientY, () => {
      updateDragMove({
        cancelable: false,
        preventDefault() {},
        stopPropagation() {},
        stopImmediatePropagation() {},
      }, drag.lastX, drag.lastY);
    });
    if (drag.ghost) {
      // Horizontal: follow the cursor 1:1 (cross-day edge-hold owns the
      // day step, no horizontal snapping). Vertical: snap to the
      // wall-clock grid via snappedDeltaY so the chip only ever lands
      // on snap-step Y multiples.
      drag.ghost.style.left = `${clientX - drag.grabOffsetX}px`;
      drag.ghost.style.top  = `${(drag.startY - drag.grabOffsetY) + snappedDeltaY}px`;
    }
    // Cross-day edge-hold check — runs every move while touch-editing so
    // the finger entering / leaving the pager's edge band arms or
    // cancels the day-step timer.
    let dayStepHapticThisFrame = false;
    if (touchEditing) {
      const beforeSteps = drag.daySteps;
      syncEdgeHold(clientX, clientY);
      dayStepHapticThisFrame = drag.daySteps !== beforeSteps;
    }
    // Render the floating quarter-hour label in the live view's
    // sidebar, and fire a selection haptic on every snap-boundary
    // crossing. The day-step haptic (impact, fired by edgeHoldTick)
    // takes precedence so the user doesn't feel two ticks in the same
    // frame.
    renderDraftStartLabel(drag, snappedStartMin);
    if (snappedStartMin !== drag.lastSnappedStartMin) {
      if (drag.lastSnappedStartMin !== null && !dayStepHapticThisFrame
          && typeof navigator !== 'undefined' && navigator.vibrate) {
        try { navigator.vibrate(SNAP_HAPTIC_MS); } catch { /* ignore */ }
      }
      drag.lastSnappedStartMin = snappedStartMin;
    }
    // Preventing default while actively dragging stops the browser from
    // hijacking touch gestures (e.g. iOS swipe-back, page rubber-band).
    if (jsEvent.cancelable) jsEvent.preventDefault();
  }

  const onPointerUp = (jsEvent) => {
    if (drag?.touch && jsEvent.type === 'pointercancel') {
      // Normally we let touchend commit on touch — Android sometimes
      // fires pointercancel mid-drag while the touch sequence keeps
      // going, and finalizing on pointercancel would prematurely abort
      // a still-live drag. But when the source chip has been torn down
      // by a cross-day edge-hold step, iOS Safari signals capture loss
      // with pointercancel and (depending on iOS version) may not fire
      // a follow-up touchend at all. Schedule a short watchdog: if a
      // real touch end / cancel does arrive in time, it cancels this
      // and finalizes normally; otherwise we finalize ourselves so the
      // drag doesn't get stuck stepping forever after the finger has
      // left the screen.
      const chipDetached = drag.sourceChip
        && typeof document !== 'undefined'
        && !document.contains(drag.sourceChip);
      if (chipDetached && !drag.pointerCancelWatchdog) {
        const d = drag;
        d.pointerCancelWatchdog = setTimeout(() => {
          if (drag !== d) return;
          d.pointerCancelWatchdog = null;
          finishDrag(jsEvent, d.lastX, d.lastY);
        }, 150);
      }
      return;
    }
    finishDrag(jsEvent, jsEvent.clientX, jsEvent.clientY);
  };

  const onTouchEnd = (jsEvent) => {
    if (!drag?.touch) return;
    // A real touch end / cancel takes priority over the pointercancel
    // watchdog above — clear it so we don't double-finalize.
    if (drag.pointerCancelWatchdog) {
      clearTimeout(drag.pointerCancelWatchdog);
      drag.pointerCancelWatchdog = null;
    }
    const touch = activeChangedTouch(jsEvent);
    finishDrag(jsEvent, touch?.clientX ?? drag.lastX, touch?.clientY ?? drag.lastY);
  };

  function finishDrag(jsEvent, clientX, clientY) {
    if (!drag) return;
    const d = drag; drag = null;
    clearTouchLongPress();
    clearEdgeHold(d);
    if (d.pointerCancelWatchdog) {
      clearTimeout(d.pointerCancelWatchdog);
      d.pointerCancelWatchdog = null;
    }
    // Cancel any in-flight cross-day slide so the lift doesn't commit
    // one extra day after the finger has already left the screen.
    const pagerApi = state.get('pagerApi');
    if (pagerApi?.abortStepDuringDrag) {
      try { pagerApi.abortStepDuringDrag(); } catch { /* ignore */ }
    }
    removeTouchDragListeners();
    stopVerticalAutoScroll(d);
    document.body.classList.remove('ec-dragging');
    if (d.dayOffsetBadge) d.dayOffsetBadge.remove();
    // Restore the chip's time-of-day text BEFORE the ghost is removed —
    // the helper walks both the source chip and the ghost so it can
    // touch any inline-style stash either side may have.
    showEventTimeText(d);
    removeDraftStartLabel(d);
    if (d.ghost) d.ghost.remove();
    if (d.sourceChip) d.sourceChip.style.opacity = '';
    if (!d.moved) return;     // tap, not a drag

    const targetCell = cellAtPoint(clientX, clientY);
    const targetDateStr = targetCell?.getAttribute('data-date');
    const targetTimeCol = timeColAtPoint(clientX, clientY);
    state.get('fire')?.('eventDragStop', {
      event: d.event, jsEvent, view: state.get('view'),
    });
    // Browser synthesises a click on the chip after pointerup; suppress
    // it so single-tap-opens-popover hosts don't see a phantom popover
    // after every drag commit/abort. See lib/click_suppression.js.
    armChipClickSuppression(state);
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
      // Wall-clock snap: round (originalStartMin + cursorDeltaMin) to
      // the nearest snapMins so the commit lands on a 00 / 15 / 30 / 45
      // boundary anchored to the day's clock — regardless of where the
      // event started. A 09:07 event becomes 09:15 / 09:30 / 09:45,
      // not 09:22 / 09:37 / 09:52. cursorDeltaMin uses (clientY - startY)
      // / pxPerMin: source and target columns share the same vertical
      // ruler in TimeGrid (the body's single scroll layer) so the delta
      // is a clean minute count regardless of which column the finger
      // ended up over.
      const cursorDeltaMin = (clientY - d.startY) / pxPerMin;
      const proposedStartMin = d.originalStartMin + cursorDeltaMin;
      const snappedStartMin = Math.round(proposedStartMin / snapMins) * snapMins;
      const snappedDeltaMin = snappedStartMin - d.originalStartMin;
      // Day-of-day part: target date - original source date. The
      // sourceDateStr is the day the chip was on when grabbed; after
      // any number of edge-hold day-steps the user lands on
      // targetDateStr in the now-current view, so (toMid - fromMid)
      // already covers the multi-day shift without a separate
      // d.daySteps accumulator.
      const fromMid = new Date(d.sourceDateStr + 'T00:00:00Z').getTime();
      const toMid   = new Date(targetDateStr   + 'T00:00:00Z').getTime();
      const dayDelta = toMid - fromMid;
      delta = dayDelta + snappedDeltaMin * 60_000;
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
    const oldEvent = { ...d.event, start: d.event.start, end: d.event.end };
    const series = eventMetaSeriesInfo(d.event);
    // newStart / newEnd carry the candidate post-drop times so listeners
    // can persist them without recomputing from `delta`. The event itself
    // isn't mutated until maybeCommitWithConfirm runs below — by which
    // point any async host PATCH has already missed the chance to read
    // the new values off the event.
    const dropDetail = {
      event: d.event,
      oldEvent,
      newStart,
      newEnd,
      delta: { days: Math.round(delta / dayMs), milliseconds: delta },
      jsEvent,
      view: state.get('view'),
      isOccurrence: series.isSeriesMember,
      seriesId: series.seriesId,
      revert: () => { reverted = true; },
    };
    state.get('fire')?.('eventDrop', dropDetail);
    if (reverted) return;

    // Commit through the public API (broadcasts + re-renders), gated
    // by confirmEventChange when the event is part of a series.
    maybeCommitWithConfirm({
      state,
      options: state.get('options'),
      event: d.event,
      kind: 'drop',
      detailExtras: { oldEvent, delta: dropDetail.delta },
      updateAttrs: {
        id: d.event.id,
        start: newStart.toISOString(),
        end:   newEnd.toISOString(),
      },
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
    // Multi-day timed events render as one chip per day, all sharing the
    // same data-event-id. Edit mode is a property of the *event*, not one
    // segment — so promote every segment together. This keeps the
    // accent ring continuous across the spanned days, and lets the
    // CSS pseudo-element handles land on the correct ends (start
    // circle on the first segment, end circle on the last) using the
    // existing .ec-event-continues-from / .ec-event-continues-to flags.
    const id = chip.getAttribute('data-event-id');
    const escapedId = (id && typeof CSS !== 'undefined' && CSS.escape) ? CSS.escape(id) : id;
    const segments = id ? Array.from(rootEl.querySelectorAll?.(`[data-event-id="${escapedId}"]`) ?? []) : [chip];
    const segmentSet = new Set(segments);
    rootEl.querySelectorAll?.('.ec-event.ec-event-editing')
      .forEach((el) => { if (!segmentSet.has(el)) el.classList.remove('ec-event-editing'); });
    segments.forEach((seg) => seg.classList.add('ec-event-editing'));
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

  // ---- Vertical snap gutter + chip-text muting -------------------------

  function hideEventTimeText(d) {
    if (d.timeTextHidden) return;
    d.timeTextHidden = true;
    const els = [];
    if (d.sourceChip) els.push(...d.sourceChip.querySelectorAll('.ec-event-time'));
    if (d.ghost) els.push(...d.ghost.querySelectorAll('.ec-event-time'));
    for (const el of els) {
      // Save and stash the prior inline value so restore puts it back
      // verbatim rather than wiping an inline style the host app set.
      el.dataset.ecDragPriorVisibility = el.style.visibility || '';
      el.style.visibility = 'hidden';
    }
  }

  function showEventTimeText(d) {
    if (!d.timeTextHidden) return;
    d.timeTextHidden = false;
    const els = [];
    if (d.sourceChip) els.push(...d.sourceChip.querySelectorAll('.ec-event-time'));
    if (d.ghost) els.push(...d.ghost.querySelectorAll('.ec-event-time'));
    for (const el of els) {
      const prior = el.dataset.ecDragPriorVisibility ?? '';
      el.style.visibility = prior;
      delete el.dataset.ecDragPriorVisibility;
    }
  }

  // Inject (or update) a single floating quarter-hour label in the live
  // view's sidebar, anchored next to the ghost's top edge. The static
  // hour labels already mark the :00 lines, so when the snap lands on
  // the hour we remove the floating label rather than stacking ":00" on
  // top of "9 AM". Suppressed when no TimeGrid sidebar is visible (e.g.
  // day-grid month view, where the drag goes through the whole-day
  // shift path that doesn't care about minutes).
  function renderDraftStartLabel(d, snappedStartMin) {
    if (!d.pxPerMin) return;
    const sidebar = rootEl.querySelector?.('.ec-pager-page-current .ec-time-grid [data-row="body"] > .ec-sidebar')
      ?? rootEl.querySelector?.('.ec-time-grid [data-row="body"] > .ec-sidebar');
    if (!sidebar) return;
    // Orphan-sweep: a previous frame may have left a label in the
    // outgoing sidebar (most often because an edge-hold day-step
    // re-mounted the live view). Cleanly remove every stale label
    // before placing the fresh one.
    const orphans = rootEl.querySelectorAll?.('[data-ec-draft-start-label]') ?? [];
    for (const o of orphans) if (o !== d.draftStartLabel) o.remove();

    const mins = ((Math.round(snappedStartMin) % 60) + 60) % 60;
    if (mins === 0) {
      // Snap landed on the hour; the permanent hour label already sits
      // at the same Y. Remove the floating tick so the gutter reads as
      // a single column of labels.
      d.draftStartLabel?.remove();
      d.draftStartLabel = null;
      return;
    }
    let label = d.draftStartLabel;
    if (!label || label.parentNode !== sidebar) {
      label?.remove();
      label = document.createElement('span');
      label.dataset.ecDraftStartLabel = '';
      label.className = 'ec-draft-start-label';
      label.style.position = 'absolute';
      label.style.right = '0.5rem';
      label.style.fontSize = '0.7rem';
      label.style.fontWeight = '600';
      label.style.color = 'var(--ec-text-color, #1a1a1a)';
      label.style.fontVariantNumeric = 'tabular-nums';
      label.style.lineHeight = '1';
      label.style.pointerEvents = 'none';
      label.style.zIndex = '3';
      // .ec-sidebar is position:sticky which creates a containing block
      // for absolute descendants, so the inline `top` below is measured
      // from the sidebar's own top.
      sidebar.appendChild(label);
      d.draftStartLabel = label;
    }
    const topPx = (snappedStartMin - d.slotMinMin) * d.pxPerMin - 6;
    label.style.top = `${topPx}px`;
    label.textContent = `:${String(mins).padStart(2, '0')}`;
  }

  function removeDraftStartLabel(d) {
    d?.draftStartLabel?.remove();
    if (d) d.draftStartLabel = null;
    // Sweep any orphan label left behind in a non-current sidebar (e.g.
    // a snapshot slot that the pager hasn't cleared yet).
    const orphans = rootEl.querySelectorAll?.('[data-ec-draft-start-label]') ?? [];
    for (const o of orphans) o.remove();
  }

  // ---- Cross-day edge-hold (mobile) ------------------------------------
  //
  // Drag a chip in edit mode into the left or right edge band of the
  // pager and the pager auto-steps to the prev / next day. The first
  // step requires a deliberate 850 ms hold so a glancing brush of the
  // edge doesn't snap you onto the next day; once committed, further
  // steps fire every 375 ms while the finger stays parked at the edge.
  // Each step animates the pager track ±viewportWidth over 230 ms with
  // a sharp cubic-bezier(0.4, 0, 1, 1) (see pager.js stepDuringDrag),
  // followed by a light haptic and a "+N days" badge on the ghost.
  //
  // The ghost lives on <body> independent of the pager track, so when
  // the track slides during a step the ghost stays glued under the
  // finger automatically.
  function syncEdgeHold(clientX, clientY) {
    if (!drag) return;
    if (!drag.touch) return;
    if (!drag.sourceChip?.classList.contains('ec-event-editing')) return;
    if (drag.swapping) return;
    const pagerApi = state.get('pagerApi');
    if (!pagerApi || typeof pagerApi.stepDuringDrag !== 'function') return;
    // Single-day TimeGrid views only. On multi-day views the within-view
    // drag already covers every visible column; adding edge-hold would
    // double-fire on the leftmost / rightmost day.
    const viewDates = state.get('viewDates') ?? [];
    if (viewDates.length !== 1) return;
    const pagerEl = pagerApi.element;
    if (!pagerEl) return;
    const rect = pagerEl.getBoundingClientRect();
    const width = rect.width || pagerEl.offsetWidth || 0;
    if (!width) return;
    // Skip the gesture if the pointer is vertically outside the pager
    // shell — the user may be reaching for the top-bar / bottom-bar.
    if (clientY < rect.top || clientY > rect.bottom) {
      clearEdgeHold(drag);
      drag.edgeHoldFirstFired = false;
      return;
    }
    const zone = Math.max(
      DAY_DRAG_EDGE_ZONE_MIN_PX,
      Math.min(DAY_DRAG_EDGE_ZONE_MAX_PX, width * DAY_DRAG_EDGE_ZONE_RATIO),
    );
    const inLeft  = clientX <= rect.left + zone;
    const inRight = clientX >= rect.right - zone;
    const direction = inLeft ? -1 : inRight ? +1 : 0;

    if (direction === 0) {
      clearEdgeHold(drag);
      drag.edgeHoldFirstFired = false;
      return;
    }
    if (drag.edgeHoldDirection === direction && drag.edgeHoldTimer) return;
    if (drag.edgeHoldDirection !== direction) {
      // Direction flip resets the camp counter — the user has to commit
      // to the new direction with another full 850 ms hold.
      drag.edgeHoldFirstFired = false;
    }
    clearEdgeHold(drag);
    drag.edgeHoldDirection = direction;
    const delay = drag.edgeHoldFirstFired
      ? DAY_DRAG_EDGE_HOLD_MS
      : DAY_DRAG_EDGE_HOLD_INITIAL_MS;
    drag.edgeHoldTimer = setTimeout(() => edgeHoldTick(direction), delay);
  }

  function clearEdgeHold(d) {
    if (!d) return;
    if (d.edgeHoldTimer) {
      clearTimeout(d.edgeHoldTimer);
      d.edgeHoldTimer = null;
    }
    d.edgeHoldDirection = 0;
  }

  async function edgeHoldTick(direction) {
    if (!drag) return;
    if (drag.swapping) return;
    const pagerApi = state.get('pagerApi');
    if (!pagerApi?.stepDuringDrag) return;
    drag.swapping = true;
    drag.edgeHoldTimer = null;
    try {
      await pagerApi.stepDuringDrag(direction);
    } catch { /* ignore */ }
    // The gesture may have ended (finishDrag cleared drag = null) while
    // the slide animation was in flight — bail rather than mutating a
    // released gesture.
    if (!drag) return;
    drag.daySteps = (drag.daySteps ?? 0) + direction;
    drag.edgeHoldFirstFired = true;
    drag.swapping = false;
    renderDayOffsetBadge(drag);
    // Light haptic matched to the visual arrival of the slide — not the
    // start of the tick. mobile_schedule_controller does the same.
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate(DAY_DRAG_HAPTIC_MS); } catch { /* ignore */ }
    }
    // If the finger is still in an edge zone, this re-arms with the
    // fast 375 ms cadence (edgeHoldFirstFired is now true) so the user
    // can race through multiple days by camping at the edge.
    syncEdgeHold(drag.lastX, drag.lastY);
  }

  function renderDayOffsetBadge(d) {
    if (!d.ghost) return;
    const n = d.daySteps ?? 0;
    if (n === 0) {
      d.dayOffsetBadge?.remove();
      d.dayOffsetBadge = null;
      return;
    }
    let badge = d.dayOffsetBadge;
    if (!badge) {
      badge = document.createElement('div');
      badge.className = 'ec-day-offset-badge';
      badge.setAttribute('aria-hidden', 'true');
      badge.style.position = 'absolute';
      badge.style.top = '6px';
      badge.style.right = '8px';
      badge.style.padding = '2px 6px';
      badge.style.borderRadius = '999px';
      badge.style.background = 'rgba(15, 23, 42, 0.78)';
      badge.style.color = '#fff';
      badge.style.fontSize = '11px';
      badge.style.fontWeight = '600';
      badge.style.lineHeight = '1';
      badge.style.letterSpacing = '0.01em';
      badge.style.pointerEvents = 'none';
      badge.style.zIndex = '2';
      d.ghost.appendChild(badge);
      d.dayOffsetBadge = badge;
    }
    const abs = Math.abs(n);
    const noun = abs === 1 ? 'day' : 'days';
    badge.textContent = n > 0 ? `+${n} ${noun}` : `−${abs} ${noun}`;
  }

  // Swallow the OS-level long-press menus / native HTML5 drag previews
  // that compete with our own long-press-to-edit gesture. We catch both
  // events on the rootEl so host apps can still right-click / drag
  // OUTSIDE the calendar normally; only chips inside the calendar root
  // are intercepted. Capture phase + non-passive so browsers that fire
  // these before bubbling still see the preventDefault. iOS Safari
  // additionally honors the -webkit-touch-callout / -webkit-user-drag
  // CSS rules (see calendar.css) for the visual side of the same
  // suppression.
  const onContextMenuCapture = (jsEvent) => {
    if (jsEvent.target.closest?.('[data-event-id]')) jsEvent.preventDefault();
  };
  const onDragStartCapture = (jsEvent) => {
    if (jsEvent.target.closest?.('[data-event-id]')) jsEvent.preventDefault();
  };

  rootEl.addEventListener('pointerdown', onPointerDown);
  rootEl.addEventListener('touchstart', onTouchStartCapture, { passive: false, capture: true });
  rootEl.addEventListener('click', onClickCapture, true);
  rootEl.addEventListener('contextmenu', onContextMenuCapture, true);
  rootEl.addEventListener('dragstart', onDragStartCapture, true);
  document.addEventListener('pointermove', onPointerMove, { passive: false });
  document.addEventListener('pointerup',   onPointerUp);
  document.addEventListener('pointercancel', onPointerUp);

  return () => {
    rootEl.removeEventListener('pointerdown', onPointerDown);
    rootEl.removeEventListener('touchstart', onTouchStartCapture, true);
    rootEl.removeEventListener('click', onClickCapture, true);
    rootEl.removeEventListener('contextmenu', onContextMenuCapture, true);
    rootEl.removeEventListener('dragstart', onDragStartCapture, true);
    document.removeEventListener('pointermove', onPointerMove);
    document.removeEventListener('pointerup',   onPointerUp);
    document.removeEventListener('pointercancel', onPointerUp);
    removeTouchDragListeners();
    clearTouchLongPress();
    if (drag) {
      clearEdgeHold(drag);
      drag.dayOffsetBadge?.remove();
      showEventTimeText(drag);
      removeDraftStartLabel(drag);
    }
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
    const delta = next - before;
    // Only commit the scroll AND compensate startY when the move went
    // in the requested direction. If the scrollEl has no scrollable
    // content (scrollHeight ≤ clientHeight) but scrollTop happens to be
    // non-zero — which can occur transiently in test envs (happy-dom
    // has no layout) or during a view re-mount mid-drag — the clamp
    // above can produce a delta with the OPPOSITE sign of the speed,
    // which previously left startY hundreds of pixels off and silently
    // corrupted the snap math.
    if (delta && Math.sign(delta) === Math.sign(gesture.autoScrollSpeed)) {
      el.scrollTop = next;
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
      armChipClickSuppression(state);
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
    armChipClickSuppression(state);
    const oldResizeEvent = { ...r.event, start: r.event.start, end: r.event.end };
    const resizeSeries = eventMetaSeriesInfo(r.event);
    const endDelta = r.handleSide === 'end'  ? { milliseconds: deltaMs, days: 0 } : { milliseconds: 0, days: 0 };
    const startDelta = r.handleSide === 'start' ? { milliseconds: deltaMs, days: 0 } : { milliseconds: 0, days: 0 };
    state.get('fire')?.('eventResize', {
      event: r.event,
      oldEvent: oldResizeEvent,
      newStart,
      newEnd,
      jsEvent,
      view: state.get('view'),
      endDelta,
      startDelta,
      isOccurrence: resizeSeries.isSeriesMember,
      seriesId: resizeSeries.seriesId,
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
    maybeCommitWithConfirm({
      state,
      options: state.get('options'),
      event: r.event,
      kind: 'resize',
      detailExtras: { oldEvent: oldResizeEvent, startDelta, endDelta },
      updateAttrs: {
        id: r.event.id,
        start: newStart.toISOString(),
        end:   newEnd.toISOString(),
      },
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
  // Touch-only gesture-gate state. Captured at pointerdown so the
  // subsequent synthesised `click` can compare against the body's
  // scroll position and the pager's swipe state.
  //
  // The bug we're closing: on touch, after the user has scrolled the
  // time-grid body OR swiped the pager, the browser fires a `click`
  // on whatever cell ends up under the lift-off point. Without this
  // gate, dateClick fires with that incidental cell and the host opens
  // a "new event" sheet the user never asked for.
  //
  // Mouse / pen input is unaffected — those clicks are intentional and
  // pass straight through. The 4-px scrollTop delta tolerates the
  // sub-pixel jitter iOS scroll inertia can leave behind.
  let lastDown = null;
  const pointerDownGate = (jsEvent) => {
    const body = rootEl.querySelector('.ec-time-grid [data-row="body"]');
    lastDown = {
      pointerType: jsEvent.pointerType,
      scrollTop: body?.scrollTop ?? null,
    };
  };

  const handler = (jsEvent) => {
    const cell = jsEvent.target.closest('[data-date]');
    if (!cell) return;
    // Skip clicks that land on events (those fire eventClick), on a
    // resize handle, or on the more-link / popover controls.
    if (jsEvent.target.closest('[data-event-id], .ec-resizer, [data-more-link], [data-popover-action]')) return;
    // Touch-aware gating — see lastDown above.
    if (lastDown?.pointerType === 'touch') {
      const body = rootEl.querySelector('.ec-time-grid [data-row="body"]');
      if (body && lastDown.scrollTop != null
          && Math.abs(body.scrollTop - lastDown.scrollTop) > 4) {
        return;
      }
      if (rootEl.querySelector('.ec-pager.ec-pager-dragging')) {
        return;
      }
    }
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
  rootEl.addEventListener('pointerdown', pointerDownGate, true);
  rootEl.addEventListener('click', handler);
  return () => {
    rootEl.removeEventListener('pointerdown', pointerDownGate, true);
    rootEl.removeEventListener('click', handler);
  };
}

// Phase A5/A6 — ResourceTimeline bar drag + resize + drag-to-reassign.
//
// ResourceTimeline bars live inside .ec-timeline-ribbon, an absolutely-
// positioned block one per resource row. Each ribbon contains a grid of
// .ec-timeline-cell[data-date] tap targets (one per visible day) sitting
// under the bars. We hit-test:
//   • pointerdown on a bar      → start a horizontal drag-to-reschedule
//   • pointerdown on a resizer  → start a horizontal resize (start or end)
//   • pointermove                → translate ghost / preview by snapped
//                                  day offsets
//   • pointerup                  → commit through calendarApi.updateEvent
//                                  with the new start/end and (if the
//                                  pointer crossed onto a different row's
//                                  ribbon) the new resourceIds.
//
// Bar geometry is in day-fractions: dayWidth = slotWidth, dayDelta =
// round((dx) / dayWidth). The renderer paints bars at `left = idx *
// dayWidth` / `width = days * dayWidth`, so the snap math is uniform.
function attachTimelineBarHandler(rootEl, state) {
  let drag = null;
  // { kind: 'move'|'resize', side?: 'start'|'end', chip, event, dayWidth,
  //   startX, startY, originalLeft, originalWidth, ribbon, ribbonRect,
  //   sourceResourceId, lastDayDelta, lastResourceId, ghost, lastX, lastY,
  //   pointerId }

  const findChip = (target) => {
    const chip = target.closest?.('[data-event-id]');
    if (!chip) return null;
    if (!chip.closest('.ec-timeline-ribbon')) return null;
    return chip;
  };

  const ribbonAtPoint = (x, y) => {
    const els = (typeof document !== 'undefined' && document.elementsFromPoint)
      ? document.elementsFromPoint(x, y) : [];
    for (const el of els) {
      const r = el.closest?.('.ec-timeline-ribbon');
      if (r && rootEl.contains(r)) return r;
    }
    return null;
  };

  const rowOf = (ribbon) => ribbon?.closest?.('.ec-timeline-row');
  const resourceIdOf = (ribbon) => rowOf(ribbon)?.getAttribute('data-resource-id') ?? null;

  const onPointerDown = (jsEvent) => {
    const options = state.get('options');
    if (jsEvent.button !== undefined && jsEvent.button !== 0) return;
    const chip = findChip(jsEvent.target);
    if (!chip) return;

    const ribbon = chip.closest('.ec-timeline-ribbon');
    const ribbonRect = ribbon.getBoundingClientRect();
    // slotWidth lives on the renderer; the ribbon's width = days *
    // slotWidth. We derive dayWidth from the chip's siblings rather than
    // re-reading options so a tested-only slotWidth override still works.
    const cells = ribbon.querySelectorAll(':scope > .ec-timeline-cells > .ec-timeline-cell');
    const dayWidth = cells.length ? (ribbonRect.width / cells.length) : (options.slotWidth ?? 32);
    const event = (state.get('filteredEvents') ?? []).find((e) => e.id === chip.getAttribute('data-event-id'));
    if (!event) return;

    const resizer = jsEvent.target.closest?.('.ec-resizer');
    const isResize = !!resizer && resizer.getAttribute('data-resize-axis') === 'x';
    if (isResize && !(options.editable && options.eventDurationEditable !== false)) return;
    if (!isResize && !(options.editable || options.eventStartEditable)) return;

    drag = {
      kind: isResize ? 'resize' : 'move',
      side: isResize ? (resizer.getAttribute('data-resizer') === 'start' ? 'start' : 'end') : null,
      chip,
      event,
      ribbon,
      ribbonRect,
      dayWidth,
      sourceResourceId: resourceIdOf(ribbon),
      lastResourceId: resourceIdOf(ribbon),
      originalLeft: parseFloat(chip.style.left || '0') || 0,
      originalWidth: parseFloat(chip.style.width || '0') || chip.getBoundingClientRect().width,
      startX: jsEvent.clientX,
      startY: jsEvent.clientY,
      lastX: jsEvent.clientX,
      lastY: jsEvent.clientY,
      moved: false,
      lastDayDelta: 0,
      pointerId: jsEvent.pointerId,
    };

    if (resizer && resizer.setPointerCapture && jsEvent.pointerId !== undefined) {
      try { resizer.setPointerCapture(jsEvent.pointerId); } catch { /* ignore */ }
    } else if (chip.setPointerCapture && jsEvent.pointerId !== undefined) {
      try { chip.setPointerCapture(jsEvent.pointerId); } catch { /* ignore */ }
    }
    if (jsEvent.cancelable) jsEvent.preventDefault();
    jsEvent.stopPropagation?.();
  };

  const onPointerMove = (jsEvent) => {
    if (!drag) return;
    drag.lastX = jsEvent.clientX;
    drag.lastY = jsEvent.clientY;
    const dx = jsEvent.clientX - drag.startX;
    const dy = jsEvent.clientY - drag.startY;
    const options = state.get('options');
    const minDist = options.eventDragMinDistance ?? 5;
    if (!drag.moved && (dx * dx + dy * dy) < minDist * minDist) return;
    if (!drag.moved) {
      drag.moved = true;
      drag.chip.classList.add(drag.kind === 'resize' ? 'ec-resizing-x' : 'ec-dragging');
      drag.chip.style.zIndex = '50';
      state.get('fire')?.(drag.kind === 'resize' ? 'eventResizeStart' : 'eventDragStart', {
        event: drag.event, jsEvent, view: state.get('view'),
      });
    }
    const dayDelta = Math.round(dx / drag.dayWidth);
    drag.lastDayDelta = dayDelta;
    if (drag.kind === 'move') {
      drag.chip.style.left  = `${drag.originalLeft + dayDelta * drag.dayWidth}px`;
    } else if (drag.side === 'end') {
      const minW = drag.dayWidth;
      drag.chip.style.width = `${Math.max(minW, drag.originalWidth + dayDelta * drag.dayWidth)}px`;
    } else { // resize from start
      const shift = Math.max(
        -drag.originalLeft,
        Math.min(drag.originalWidth - drag.dayWidth, dayDelta * drag.dayWidth),
      );
      drag.chip.style.left  = `${drag.originalLeft + shift}px`;
      drag.chip.style.width = `${drag.originalWidth - shift}px`;
    }

    // Phase A6 — drag-to-reassign. Detect the ribbon under the pointer
    // (move-mode only). Only updates the drag's lastResourceId for now;
    // the actual chip-row transfer happens on commit so the in-flight
    // ghost stays visually stable.
    if (drag.kind === 'move') {
      const r = ribbonAtPoint(jsEvent.clientX, jsEvent.clientY);
      const rid = r ? resourceIdOf(r) : null;
      drag.lastResourceId = rid ?? drag.sourceResourceId;
      rootEl.querySelectorAll('.ec-timeline-row[data-row-drop="true"]')
        .forEach((n) => n.removeAttribute('data-row-drop'));
      if (r && rid !== drag.sourceResourceId) {
        rowOf(r)?.setAttribute('data-row-drop', 'true');
      }
    }
    if (jsEvent.cancelable) jsEvent.preventDefault();
  };

  const onPointerUp = (jsEvent) => {
    if (!drag) return;
    const d = drag; drag = null;
    rootEl.querySelectorAll('.ec-timeline-row[data-row-drop="true"]')
      .forEach((n) => n.removeAttribute('data-row-drop'));
    d.chip.classList.remove('ec-resizing-x');
    d.chip.classList.remove('ec-dragging');
    d.chip.style.zIndex = '';
    if (!d.moved) return;

    state.get('fire')?.(d.kind === 'resize' ? 'eventResizeStop' : 'eventDragStop', {
      event: d.event, jsEvent, view: state.get('view'),
    });
    armChipClickSuppression(state);

    const dayMs = 86400000;
    let newStart = new Date(d.event.start.getTime());
    let newEnd   = new Date(d.event.end.getTime());
    let newResourceIds = d.event.resourceIds;
    let resourceChanged = false;

    if (d.kind === 'move') {
      newStart = new Date(newStart.getTime() + d.lastDayDelta * dayMs);
      newEnd   = new Date(newEnd.getTime()   + d.lastDayDelta * dayMs);
      if (d.lastResourceId && d.lastResourceId !== d.sourceResourceId) {
        // Replace only the dragged-from resource id with the target's;
        // keep any other resources on the event intact (matches Open
        // Question #3 in the gap plan).
        const set = (d.event.resourceIds ?? []).slice();
        const i = set.indexOf(d.sourceResourceId);
        if (i >= 0) set[i] = d.lastResourceId; else set.push(d.lastResourceId);
        newResourceIds = set;
        resourceChanged = true;
      }
    } else if (d.side === 'end') {
      newEnd = new Date(newEnd.getTime() + d.lastDayDelta * dayMs);
      if (newEnd.getTime() <= newStart.getTime()) newEnd = new Date(newStart.getTime() + dayMs);
    } else {
      newStart = new Date(newStart.getTime() + d.lastDayDelta * dayMs);
      if (newStart.getTime() >= newEnd.getTime()) newStart = new Date(newEnd.getTime() - dayMs);
    }

    let reverted = false;
    const oldEvent = { ...d.event, start: d.event.start, end: d.event.end };
    const fireName = d.kind === 'resize' ? 'eventResize' : 'eventDrop';
    const tlSeries = eventMetaSeriesInfo(d.event);
    // newStart / newEnd carry the candidate post-drop times — see the
    // DayGrid/TimeGrid drop site above for the rationale (host listeners
    // that want to persist need the new times, but the event isn't
    // mutated until after the eventDrop dispatch).
    const detail = {
      event: d.event,
      oldEvent,
      newStart,
      newEnd,
      jsEvent,
      view: state.get('view'),
      isOccurrence: tlSeries.isSeriesMember,
      seriesId: tlSeries.seriesId,
      revert: () => { reverted = true; },
    };
    if (d.kind === 'move') {
      detail.delta = { days: d.lastDayDelta, milliseconds: d.lastDayDelta * dayMs };
      if (resourceChanged) {
        detail.oldResource = d.sourceResourceId;
        detail.newResource = d.lastResourceId;
        detail.newResourceIds = newResourceIds;
      }
    } else {
      const ms = d.lastDayDelta * dayMs;
      detail.endDelta   = d.side === 'end'   ? { milliseconds: ms, days: d.lastDayDelta } : { milliseconds: 0, days: 0 };
      detail.startDelta = d.side === 'start' ? { milliseconds: ms, days: d.lastDayDelta } : { milliseconds: 0, days: 0 };
    }
    state.get('fire')?.(fireName, detail);
    if (reverted) return;

    const payload = {
      id: d.event.id,
      start: newStart.toISOString(),
      end:   newEnd.toISOString(),
    };
    if (resourceChanged) payload.resourceIds = newResourceIds;
    maybeCommitWithConfirm({
      state,
      options: state.get('options'),
      event: d.event,
      kind: d.kind === 'resize' ? 'resize' : 'drop',
      detailExtras: {
        oldEvent,
        delta: detail.delta,
        startDelta: detail.startDelta,
        endDelta: detail.endDelta,
      },
      updateAttrs: payload,
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
  };
}


// Phase F — pointer range-select. selectable: true wires this on. The
// gesture starts on an empty [data-date] cell (NOT on an event chip /
// resizer / button), drags across cells while painting an
// ec-select-highlight rect on each touched cell, and on pointerup
// fires `select` with { start, end, allDay, resource, jsEvent, view }
// + sets state.selection so the controller's unselect() can clear it.
//
// Honoured options:
//   selectable             — master switch
//   selectMinDistance      — px threshold before a press becomes a drag
//   selectLongPressDelay   — touch only: ms hold before the drag arms
//   selectBackgroundColor  — overrides the default highlight bg
//   selectConstraint       — { start, end } interval the range must
//                            stay inside (mirrors upstream)
function attachRangeSelectHandler(rootEl, state) {
  let sel = null;
  let press = null;
  let highlights = [];

  const cellAtPoint = (x, y) => {
    const els = (typeof document !== 'undefined' && document.elementsFromPoint)
      ? document.elementsFromPoint(x, y) : [];
    for (const el of els) {
      // Skip event chips + interactive widgets so a drag that starts
      // on a bar still goes through the drag/resize pipelines.
      if (el.closest?.('[data-event-id], .ec-resizer, .ec-button, button, [data-more-link], [data-popover-action]')) {
        return null;
      }
      const cell = el.closest?.('[data-date]');
      if (cell && rootEl.contains(cell)) return cell;
    }
    return null;
  };

  const clearHighlights = () => {
    for (const h of highlights) h.classList.remove('ec-select-highlight');
    highlights = [];
  };

  const paintRange = (a, b) => {
    clearHighlights();
    if (!a || !b) return;
    const allCells = Array.from(rootEl.querySelectorAll('[data-date]'));
    const ai = allCells.indexOf(a);
    const bi = allCells.indexOf(b);
    if (ai < 0 || bi < 0) return;
    const lo = Math.min(ai, bi);
    const hi = Math.max(ai, bi);
    for (let i = lo; i <= hi; ++i) {
      allCells[i].classList.add('ec-select-highlight');
      highlights.push(allCells[i]);
    }
  };

  const inConstraint = (date) => {
    const opts = state.get('options');
    const c = opts.selectConstraint;
    if (!c) return true;
    const s = c.start ? new Date(c.start).getTime() : -Infinity;
    const e = c.end   ? new Date(c.end).getTime()   :  Infinity;
    const t = date instanceof Date ? date.getTime() : new Date(date).getTime();
    return t >= s && t < e;
  };

  const armSelect = (jsEvent, sourceCell) => {
    sel = {
      sourceCell,
      sourceDate: sourceCell.getAttribute('data-date'),
      startX: jsEvent.clientX,
      startY: jsEvent.clientY,
      pointerId: jsEvent.pointerId,
      moved: false,
      lastCell: sourceCell,
    };
    paintRange(sourceCell, sourceCell);
  };

  const onPointerDown = (jsEvent) => {
    const options = state.get('options');
    if (!options.selectable) return;
    if (jsEvent.button !== undefined && jsEvent.button !== 0) return;
    const cell = cellAtPoint(jsEvent.clientX, jsEvent.clientY);
    if (!cell) return;

    if (jsEvent.pointerType === 'touch') {
      // Touch needs a long-press to opt into select so scrolling /
      // tap-to-event-click on phones still works.
      const delay = options.selectLongPressDelay ?? options.longPressDelay ?? 1000;
      press = { cell, jsEvent, timer: setTimeout(() => {
        if (!press) return;
        armSelect(press.jsEvent, press.cell);
        press = null;
      }, delay) };
      return;
    }
    armSelect(jsEvent, cell);
    if (jsEvent.cancelable) jsEvent.preventDefault();
  };

  const onPointerMove = (jsEvent) => {
    if (press) { clearTimeout(press.timer); press = null; }
    if (!sel) return;
    const dx = jsEvent.clientX - sel.startX;
    const dy = jsEvent.clientY - sel.startY;
    const minDist = state.get('options').selectMinDistance ?? 5;
    if (!sel.moved && (dx * dx + dy * dy) < minDist * minDist) return;
    sel.moved = true;
    const cell = cellAtPoint(jsEvent.clientX, jsEvent.clientY);
    if (!cell) return;
    sel.lastCell = cell;
    paintRange(sel.sourceCell, cell);
    if (jsEvent.cancelable) jsEvent.preventDefault();
  };

  const onPointerUp = (jsEvent) => {
    if (press) { clearTimeout(press.timer); press = null; }
    if (!sel) return;
    const s = sel; sel = null;
    if (!s.moved) { clearHighlights(); return; }
    const targetCell = s.lastCell;
    const fromStr = s.sourceDate;
    const toStr   = targetCell.getAttribute('data-date');
    let startStr = fromStr <= toStr ? fromStr : toStr;
    let endStr   = fromStr <= toStr ? toStr   : fromStr;
    const start = new Date(startStr + 'T00:00:00Z');
    const endIncl = new Date(endStr + 'T00:00:00Z');
    const end = new Date(endIncl.getTime() + 86400000);
    if (!inConstraint(start) || !inConstraint(end)) { clearHighlights(); return; }
    const resourceId = s.sourceCell.closest?.('[data-resource-id]')?.getAttribute('data-resource-id');
    const detail = {
      start, end, allDay: true, resource: resourceId ?? null,
      jsEvent, view: state.get('view'),
    };
    state.set('selection', { start, end, resource: resourceId ?? null });
    state.get('fire')?.('select', detail);
    if (state.get('options').unselectAuto !== false) {
      // Highlights stay painted until next pointerdown elsewhere
      // (matches upstream behaviour). Hosts call api.unselect() to clear.
    }
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
    if (press) clearTimeout(press.timer);
    clearHighlights();
  };
}

