// Pager — macOS-Calendar-style swipe navigation between adjacent date
// pages. Wraps a view factory in a three-page carousel; pre-renders the
// previous and next date pages lazily on first gesture, follows the
// finger/pointer/wheel with a translate3d transform, and on commit
// rotates which slot is "live" so the swipe rests in place (no snap-back
// to centre). Backs:
//
//   - touch swipe (Pointer Events, with Touch Events fallback)
//   - trackpad horizontal scroll (deltaX accumulation)
//   - keyboard left/right arrows (instant nav, no animation)
//
// Layout: the pager is `position: relative; overflow: hidden;` and the
// track holds three pages. The CURRENT page is in normal flow, so the
// pager's height tracks the live view's natural height. PREV / NEXT pages
// are absolutely positioned at right:100% and left:100% respectively, so
// adjacent snapshots never bleed into the pager's measured height — the
// month view stays the same height when scrolling between months of
// different week-counts.

import {
  addDuration, subtractDuration, cloneDate,
} from '../lib/date.js';
import {
  currentRange as computeCurrentRange,
  activeRange as computeActiveRange,
  viewDates as computeViewDates,
  view as computeView,
  viewTitle as computeViewTitle,
  intlRange,
  filteredEvents as computeFilteredEvents,
} from '../lib/derived.js';

const SWIPE_THRESHOLD_FRACTION = 0.22;
const SWIPE_THRESHOLD_MAX = 140;
const SWIPE_ANIM_MS = 260;
const SWIPE_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
const VERTICAL_GUARD = 6;
const WHEEL_END_DEBOUNCE = 180;
const WHEEL_THRESHOLD_FRACTION = 0.35;
const WHEEL_THRESHOLD_MAX = 200;
// Programmatic day-step (used by the Interaction plugin's edge-hold
// cross-day drag on mobile). Faster + sharper than a finger swipe — the
// user's already committed by camping at the edge, so the slide doesn't
// need to feel forgiving. Mirrors mobile_schedule_controller's FLY_MS.
const STEP_DURING_DRAG_MS = 230;
const STEP_DURING_DRAG_EASE = 'cubic-bezier(0.4, 0, 1, 1)';

// createPager(container, state, factory, { onNavigate }) → { destroy }
//
//   container — the calendar's main view slot (this._mainEl)
//   state     — the live MainState (so the centre view stays fully reactive)
//   factory   — the view component factory returned by setViewOptions
//   onNavigate({ direction }) — called AFTER the pager has already
//     reshuffled internally to rest on the destination page; the host
//     should call api.next() / api.prev() to commit the new date so the
//     freshly-mounted live view re-renders with the right data.
export function createPager(container, state, factory, { onNavigate }) {
  const pager = el('div', 'ec-pager', { tabindex: '0' });
  const track = el('div', 'ec-pager-track');
  // Three persistent slot elements. Class names are assigned dynamically
  // (current / prev / next) based on the current rotation, so the slot
  // that's about to become the new "current" can take that role without
  // moving in the DOM.
  const slots = [
    el('div', 'ec-pager-page'),
    el('div', 'ec-pager-page'),
    el('div', 'ec-pager-page'),
  ];
  track.append(...slots);
  pager.append(track);
  container.replaceChildren(pager);

  // Rotation pointer: slots[liveIdx] holds the live view; the other two
  // hold lazy snapshots of the prev/next date pages. Starts at 1 (middle).
  let liveIdx = 1;
  // Per-slot snapshot teardowns; live slot keeps its teardown in
  // liveTeardown. snapshotTeardowns[liveIdx] is always null while liveIdx
  // is the live slot.
  const snapshotTeardowns = [null, null, null];

  applySlotClasses();
  let liveTeardown = factory(slots[liveIdx], state);
  setTransform(0, false);

  // When the date changes via something OTHER than this pager (toolbar
  // prev/next, .calendarApi.gotoDate, dates picker, etc.) the live view
  // re-renders inside its slot via its own onAny subscriptions, but any
  // stale prev/next snapshots stay around. Clear them so the next gesture
  // builds fresh ones for the new date. We deliberately do NOT touch the
  // track transform here — when the change is external, the track is
  // already at rest. When the change comes from animateAndCommit below, we
  // call clearSnapshots ourselves at the right point.
  let suppressRangeSub = false;
  const rangeSub = state.on('change:currentRange', () => {
    if (suppressRangeSub) return;
    clearAllSnapshots();
  });

  // ----------------------------------------------------------------------

  function applySlotClasses() {
    const prevIdx = mod3(liveIdx - 1);
    const nextIdx = mod3(liveIdx + 1);
    for (let i = 0; i < 3; ++i) {
      const slot = slots[i];
      slot.classList.remove('ec-pager-page-prev', 'ec-pager-page-current', 'ec-pager-page-next');
      slot.removeAttribute('aria-hidden');
      if (i === liveIdx) {
        slot.classList.add('ec-pager-page-current');
      } else if (i === prevIdx) {
        slot.classList.add('ec-pager-page-prev');
        slot.setAttribute('aria-hidden', 'true');
      } else if (i === nextIdx) {
        slot.classList.add('ec-pager-page-next');
        slot.setAttribute('aria-hidden', 'true');
      }
    }
  }

  function ensureSnapshots() {
    const options = state.get('options');
    const inc = options.dateIncrement ?? options.duration;
    if (!inc) return;
    const prevIdx = mod3(liveIdx - 1);
    const nextIdx = mod3(liveIdx + 1);

    // The time-grid view's render() runs a first-mount auto-scroll
    // (centers "now" when today is in view, else falls to scrollTime).
    // Each fresh factory invocation gets its own savedScrollTop closure
    // starting null, so a snapshot rendered for the prev/next page lands
    // at scrollTime — not at the user's current scroll position. Sync
    // the snapshot's body scrollTop to the live's right after render so
    // the swipe animation reveals the destination at the *same*
    // time-of-day the user is looking at, not the day's top.
    const liveBody = slots[liveIdx].querySelector?.('[data-row="body"]');
    const liveScrollTop = liveBody?.scrollTop ?? 0;

    if (!snapshotTeardowns[prevIdx]) {
      const date = subtractDuration(cloneDate(options.date), inc);
      const snap = createSnapshotState(state, date);
      slots[prevIdx].replaceChildren();
      snapshotTeardowns[prevIdx] = factory(slots[prevIdx], snap);
      const b = slots[prevIdx].querySelector?.('[data-row="body"]');
      if (b) b.scrollTop = liveScrollTop;
    }
    if (!snapshotTeardowns[nextIdx]) {
      const date = addDuration(cloneDate(options.date), inc);
      const snap = createSnapshotState(state, date);
      slots[nextIdx].replaceChildren();
      snapshotTeardowns[nextIdx] = factory(slots[nextIdx], snap);
      const b = slots[nextIdx].querySelector?.('[data-row="body"]');
      if (b) b.scrollTop = liveScrollTop;
    }
  }

  function clearAllSnapshots() {
    for (let i = 0; i < 3; ++i) {
      if (i === liveIdx) continue;
      if (snapshotTeardowns[i]) {
        snapshotTeardowns[i]();
        snapshotTeardowns[i] = null;
      }
      slots[i].replaceChildren();
    }
  }

  function setTransform(px, animate) {
    // Drive the track transform via a CSS custom property on the pager
    // element so any child that wants to "stay put" during a swipe (e.g.
    // the TimeGrid time-axis column) can counter-translate by reading
    // var(--ec-pager-px) and applying the negative — without us having
    // to know about every fixed-axis element in JS.
    pager.style.setProperty('--ec-pager-px', `${px}px`);
    pager.style.setProperty('--ec-pager-transition',
      animate ? `transform ${SWIPE_ANIM_MS}ms ${SWIPE_EASE}` : 'none');
    // Keep the direct style as a fallback so anything that doesn't read
    // the var still works.
    track.style.transition = animate
      ? `transform ${SWIPE_ANIM_MS}ms ${SWIPE_EASE}`
      : 'none';
    track.style.transform = `translate3d(${px}px, 0, 0)`;
  }

  // After the swipe animation lands at ±pageWidth, rotate which slot is
  // "live" so the rest position is exactly where we ended — no snap-back.
  // direction = +1 (we slid LEFT to expose next) or -1 (we slid RIGHT to
  // expose prev).
  function rotateAndCommit(direction) {
    // The snapshot that's been animated into the viewport is the new live.
    const newLiveIdx = mod3(liveIdx + direction);

    // Capture the user's current vertical position from the snapshot
    // they've been looking at during the swipe. We need it before the
    // factory replaces the snapshot's DOM with a fresh live render
    // (which would otherwise auto-scroll to scrollTime / "now"). The
    // captured value is re-applied to the new live's body after the
    // factory call at the bottom of this function.
    const destBody = slots[newLiveIdx].querySelector?.('[data-row="body"]');
    const destScrollTop = destBody?.scrollTop ?? null;

    // Tear down the old live view in its (now off-screen) slot.
    if (liveTeardown) { liveTeardown(); liveTeardown = null; }
    slots[liveIdx].replaceChildren();

    // The slot opposite the direction we travelled (now far away in the
    // ring) holds an old snapshot of the OLD date's other neighbour — it's
    // stale because the date is about to change. Tear it down.
    const oppositeIdx = mod3(liveIdx - direction);
    if (snapshotTeardowns[oppositeIdx]) {
      snapshotTeardowns[oppositeIdx]();
      snapshotTeardowns[oppositeIdx] = null;
    }
    slots[oppositeIdx].replaceChildren();

    // Promote the destination slot.
    liveIdx = newLiveIdx;

    // Reset the track transform to the rest position without animation,
    // simultaneously reassigning prev/current/next classes. The snapshot
    // that the user is already looking at stays put visually because it's
    // now in the .ec-pager-page-current slot, which is in normal flow and
    // sits at viewport left:0 with track.translateX(0).
    applySlotClasses();
    setTransform(0, false);

    // Replace the snapshot with the live view. Replace the children in a
    // single replaceChildren batch — the factory's first render builds a
    // fresh DOM tree and assigns it atomically. Suppress the range
    // subscription so it doesn't clobber things while api.next() fires.
    suppressRangeSub = true;
    onNavigate?.({ direction });
    // Tear down the snapshot teardown (its DOM children get replaced by
    // the factory's render below).
    if (snapshotTeardowns[liveIdx]) {
      snapshotTeardowns[liveIdx]();
      snapshotTeardowns[liveIdx] = null;
    }
    liveTeardown = factory(slots[liveIdx], state);
    // Re-apply the user's pre-swipe scroll position to the freshly-
    // mounted live body. The factory's first render auto-scrolled to
    // scrollTime (or "now"); this overrides that so the user lands on
    // the new date at the same time-of-day they were looking at.
    if (destScrollTop != null) {
      const newLiveBody = slots[liveIdx].querySelector?.('[data-row="body"]');
      if (newLiveBody) newLiveBody.scrollTop = destScrollTop;
    }
    suppressRangeSub = false;
  }

  // --- pointer / touch ---------------------------------------------------

  let drag = null; // { startX, startY, lastX, lastY, pointerId, touchId, decided, abandoned }
  let touchListening = false;

  function onPointerDown(ev) {
    if (drag || wheelGesture) return;
    if (ev.button !== undefined && ev.button !== 0) return;
    // Desktop mouse: skip — mouse drags on the calendar are for moving
    // events / creating ranges, NOT for navigating to the prev/next
    // page. Mouse users navigate via the toolbar buttons or
    // ArrowLeft / ArrowRight on the focused pager. Touch + pen still
    // pan because that's the expected gesture on iPad / mobile.
    if (ev.pointerType === 'mouse') return;
    if (shouldSkipSwipeStart(ev.target, { allowEventChips: ev.pointerType === 'touch' })) return;
    beginGesture(ev.clientX, ev.clientY, { pointerId: ev.pointerId });
    document.addEventListener('pointermove', onPointerMove, { passive: false });
    document.addEventListener('pointerup', onPointerUp);
    document.addEventListener('pointercancel', onPointerUp);
  }

  function onTouchStart(ev) {
    if (wheelGesture) return;
    if (ev.touches?.length !== 1) return;
    const touch = ev.touches[0];
    if (drag) {
      drag.touchId ??= touch.identifier;
      listenForTouch();
      return;
    }
    if (shouldSkipSwipeStart(ev.target, { allowEventChips: true })) return;
    beginGesture(touch.clientX, touch.clientY, { touchId: touch.identifier });
    listenForTouch();
  }

  function listenForTouch() {
    if (touchListening) return;
    touchListening = true;
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onTouchEnd, { passive: false });
    document.addEventListener('touchcancel', onTouchEnd, { passive: false });
  }

  function beginGesture(clientX, clientY, { pointerId, touchId } = {}) {
    drag = {
      startX: clientX, startY: clientY,
      lastX: clientX, lastY: clientY,
      pointerId, touchId,
      decided: false, abandoned: false,
    };
  }

  function onPointerMove(ev) {
    if (!drag || drag.abandoned) return;
    updateGesture(ev.clientX, ev.clientY, ev);
  }

  function onTouchMove(ev) {
    if (!drag || drag.abandoned) return;
    const touch = touchForEvent(ev);
    if (!touch) return;
    updateGesture(touch.clientX, touch.clientY, ev);
  }

  function updateGesture(clientX, clientY, ev) {
    if (document.body.classList.contains('ec-dragging') || document.body.classList.contains('ec-resizing-active')) {
      drag.abandoned = true;
      endGesture();
      return;
    }
    drag.lastX = clientX;
    drag.lastY = clientY;
    const dx = clientX - drag.startX;
    const dy = clientY - drag.startY;
    if (!drag.decided) {
      if (Math.abs(dy) > Math.abs(dx) + VERTICAL_GUARD) {
        drag.abandoned = true;
        return;
      }
      if (Math.abs(dx) < 6) return;
      drag.decided = true;
      ensureSnapshots();
      pager.classList.add('ec-pager-dragging');
      try { pager.setPointerCapture?.(drag.pointerId); } catch { /* ignore */ }
    }
    if (ev.cancelable) ev.preventDefault();
    setTransform(dx, false);
  }

  function onPointerUp(ev) {
    endGesture();
  }

  function onTouchEnd(ev) {
    const touch = touchForEvent(ev);
    if (touch && drag) {
      drag.lastX = touch.clientX;
      drag.lastY = touch.clientY;
    }
    endGesture();
  }

  function endGesture() {
    if (!drag) return;
    const d = drag; drag = null;
    document.removeEventListener('pointermove', onPointerMove);
    document.removeEventListener('pointerup', onPointerUp);
    document.removeEventListener('pointercancel', onPointerUp);
    removeTouchListeners();
    if (!d.decided || d.abandoned) {
      pager.classList.remove('ec-pager-dragging');
      setTransform(0, false);
      return;
    }
    const dx = d.lastX - d.startX;
    const width = pager.offsetWidth || container.offsetWidth || 1;
    const threshold = Math.min(width * SWIPE_THRESHOLD_FRACTION, SWIPE_THRESHOLD_MAX);
    if (dx <= -threshold) {
      animateAndCommit(-width, +1);
    } else if (dx >= threshold) {
      animateAndCommit(+width, -1);
    } else {
      // Snap back — keep the dragging class on until the snap-back
      // animation completes so the prev/next pages stay visible while
      // they slide back off-screen.
      setTransform(0, true);
      setTimeout(() => pager.classList.remove('ec-pager-dragging'), SWIPE_ANIM_MS);
    }
  }

  function touchForEvent(ev) {
    const lists = [ev.touches, ev.changedTouches];
    for (const list of lists) {
      if (!list) continue;
      for (const touch of Array.from(list)) {
        if (touch.identifier === drag?.touchId) return touch;
      }
    }
    return ev.touches?.[0] ?? ev.changedTouches?.[0] ?? null;
  }

  function removeTouchListeners() {
    if (!touchListening) return;
    touchListening = false;
    document.removeEventListener('touchmove', onTouchMove);
    document.removeEventListener('touchend', onTouchEnd);
    document.removeEventListener('touchcancel', onTouchEnd);
  }

  function shouldSkipSwipeStart(target, { allowEventChips = false } = {}) {
    if (target.closest?.('.ec-resizer, .ec-event.ec-event-editing')) return true;
    if (!allowEventChips && target.closest?.('[data-event-id]')) return true;
    return !!target.closest?.('[data-more-link], [data-popover-action], .ec-pager-no-swipe, .ec-button, button, input, select, textarea, a');
  }

  // --- wheel / trackpad --------------------------------------------------

  let wheelGesture = null; // { acc, endTimer }
  let wheelCleanupTimer = null;

  function onWheel(ev) {
    if (drag) return;
    if (Math.abs(ev.deltaX) <= Math.abs(ev.deltaY)) return;
    ev.preventDefault();
    if (!wheelGesture) {
      wheelGesture = { acc: 0, endTimer: null };
      ensureSnapshots();
      pager.classList.add('ec-pager-dragging');
    }
    wheelGesture.acc -= ev.deltaX;
    const width = pager.offsetWidth || container.offsetWidth || 1;
    const clamped = Math.max(-width, Math.min(width, wheelGesture.acc));
    setTransform(clamped, false);

    const threshold = Math.min(width * WHEEL_THRESHOLD_FRACTION, WHEEL_THRESHOLD_MAX);
    clearTimeout(wheelGesture.endTimer);
    if (wheelGesture.acc <= -threshold) {
      wheelGesture = null;
      pager.classList.remove('ec-pager-dragging');
      animateAndCommit(-width, +1);
    } else if (wheelGesture.acc >= threshold) {
      wheelGesture = null;
      pager.classList.remove('ec-pager-dragging');
      animateAndCommit(+width, -1);
    } else {
      wheelGesture.endTimer = setTimeout(() => {
        if (!wheelGesture) return;
        wheelGesture = null;
        pager.classList.remove('ec-pager-dragging');
        setTransform(0, true);
      }, WHEEL_END_DEBOUNCE);
    }
    clearTimeout(wheelCleanupTimer);
    wheelCleanupTimer = setTimeout(clearAllSnapshots, 1500);
  }

  // --- keyboard ---------------------------------------------------------

  function onKeyDown(ev) {
    if (ev.target !== pager && !pager.contains(ev.target)) return;
    if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
    if (ev.target.matches?.('input, textarea, select, [contenteditable="true"]')) return;
    if (ev.key === 'ArrowLeft')  {
      ev.preventDefault();
      ensureSnapshots();
      pager.classList.add('ec-pager-dragging');
      animateAndCommit(window.innerWidth || pager.offsetWidth, -1);
    } else if (ev.key === 'ArrowRight') {
      ev.preventDefault();
      ensureSnapshots();
      pager.classList.add('ec-pager-dragging');
      animateAndCommit(-(window.innerWidth || pager.offsetWidth), +1);
    }
  }

  function animateAndCommit(toPx, direction) {
    setTransform(toPx, true);
    setTimeout(() => {
      rotateAndCommit(direction);
      pager.classList.remove('ec-pager-dragging');
    }, SWIPE_ANIM_MS);
  }

  // Programmatic single-day step driven by the Interaction plugin's
  // edge-hold cross-day drag on mobile. The user's finger is already
  // camped at a left/right edge; we slide the track ±width over
  // STEP_DURING_DRAG_MS with a sharper ease, then rotate so the
  // destination snapshot becomes the new live view. Returns a Promise
  // that resolves after the rotation completes so the caller can fire a
  // haptic, re-arm the next-step timer, etc.
  //
  // Before animating, the destination snapshot's body scrollTop is set
  // to match the live body's so the day-step doesn't flicker the
  // user's vertical position. After the rotation the freshly-mounted
  // live view has its own savedScrollTop closure starting at null; we
  // re-apply the same scrollTop so the user's finger stays glued to the
  // same time-of-day on the new day.
  // The single in-flight day-step (if any). Tracked at the pager level
  // so the Interaction plugin can call abortStepDuringDrag() on finger
  // lift and the slide cancels cleanly — without aborting, a lift mid-
  // animation would still commit the destination day, surprising the
  // user with one extra advance after their finger left the screen.
  let activeStep = null;

  function stepDuringDrag(direction) {
    return new Promise((resolve) => {
      const width = pager.offsetWidth || container.offsetWidth || 0;
      if (!width || (direction !== 1 && direction !== -1)) {
        resolve();
        return;
      }
      ensureSnapshots();
      const liveBody = slots[liveIdx].querySelector?.('[data-row="body"]');
      const liveScrollTop = liveBody?.scrollTop ?? 0;
      const destIdx = mod3(liveIdx + direction);
      const destBody = slots[destIdx].querySelector?.('[data-row="body"]');
      if (destBody) destBody.scrollTop = liveScrollTop;

      pager.classList.add('ec-pager-dragging');
      const toPx = -direction * width;
      track.style.transition = `transform ${STEP_DURING_DRAG_MS}ms ${STEP_DURING_DRAG_EASE}`;
      pager.style.setProperty('--ec-pager-transition',
        `transform ${STEP_DURING_DRAG_MS}ms ${STEP_DURING_DRAG_EASE}`);
      pager.style.setProperty('--ec-pager-px', `${toPx}px`);
      track.style.transform = `translate3d(${toPx}px, 0, 0)`;

      const step = { resolve, aborted: false };
      step.timer = setTimeout(() => {
        if (step.aborted) return;
        if (activeStep === step) activeStep = null;
        rotateAndCommit(direction);
        pager.classList.remove('ec-pager-dragging');
        const newLiveBody = slots[liveIdx].querySelector?.('[data-row="body"]');
        if (newLiveBody) newLiveBody.scrollTop = liveScrollTop;
        resolve();
      }, STEP_DURING_DRAG_MS);
      activeStep = step;
    });
  }

  // Cancel any in-flight stepDuringDrag and snap the track back to
  // baseline. Used by the Interaction plugin when the user's finger
  // leaves the screen mid-slide, so the lift doesn't commit one extra
  // day after the gesture has ended.
  function abortStepDuringDrag() {
    if (!activeStep) return false;
    const step = activeStep;
    activeStep = null;
    step.aborted = true;
    clearTimeout(step.timer);
    track.style.transition = 'none';
    pager.style.setProperty('--ec-pager-transition', 'none');
    pager.style.setProperty('--ec-pager-px', '0px');
    track.style.transform = 'translate3d(0px, 0, 0)';
    pager.classList.remove('ec-pager-dragging');
    step.resolve();
    return true;
  }

  pager.addEventListener('pointerdown', onPointerDown, { capture: true });
  pager.addEventListener('touchstart', onTouchStart, { capture: true, passive: true });
  pager.addEventListener('wheel', onWheel, { passive: false });
  pager.addEventListener('keydown', onKeyDown);

  return {
    destroy() {
      rangeSub?.();
      try { if (liveTeardown) liveTeardown(); } catch { /* ignore */ }
      clearAllSnapshots();
      clearTimeout(wheelCleanupTimer);
      pager.removeEventListener('pointerdown', onPointerDown, { capture: true });
      pager.removeEventListener('touchstart', onTouchStart, { capture: true });
      pager.removeEventListener('wheel', onWheel);
      pager.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
      document.removeEventListener('pointercancel', onPointerUp);
      removeTouchListeners();
      container.replaceChildren();
    },
    // The pager root element — exposed so the Interaction plugin can
    // measure the edge zones for cross-day drag against the live
    // viewport (rather than the calendar root, which on mobile shells
    // also covers the toolbar / bottom-bar gutters).
    element: pager,
    stepDuringDrag,
    abortStepDuringDrag,
    // Test helper — surfaces the inner DOM nodes without coupling tests
    // to the class names directly.
    _nodes() {
      return {
        pager, track,
        prevPage: slots.find((s) => s.classList.contains('ec-pager-page-prev')),
        currentPage: slots.find((s) => s.classList.contains('ec-pager-page-current')),
        nextPage: slots.find((s) => s.classList.contains('ec-pager-page-next')),
      };
    },
  };
}

// Lightweight read-only state proxy for a snapshot page. Reads
// date-derived keys from precomputed values; everything else falls
// through to the parent. .on/.onAny return no-op unsubs so the
// view factory's "subscribe and re-render" idiom won't double-render
// snapshots; .set is a no-op because snapshots are read-only.
function createSnapshotState(parent, dateOverride) {
  const parentOptions = parent.get('options');
  const snapOptions = { ...parentOptions, date: dateOverride };

  const cr = computeCurrentRange(snapOptions.date, snapOptions.duration, snapOptions.firstDay);
  const ar = computeActiveRange(cr, parent.get('extensions')?.activeRange);
  const vd = computeViewDates(ar, snapOptions.hiddenDays ?? []);
  const intlT = intlRange(snapOptions.locale, snapOptions.titleFormat);
  const vt = computeViewTitle(intlT, cr);
  const v = computeView(snapOptions.view, vt, cr, ar);

  const events = parent.get('events') ?? snapOptions.events ?? [];
  const eventsArr = Array.isArray(events) ? events : [];
  const resources = parent.get('resources') ?? snapOptions.resources ?? [];
  const resourcesArr = Array.isArray(resources) ? resources : [];
  const fe = computeFilteredEvents(eventsArr, v, {
    eventFilter: snapOptions.eventFilter,
    eventOrder: snapOptions.eventOrder,
    filterEventsWithResources: snapOptions.filterEventsWithResources,
    resources: resourcesArr,
  });

  const overrides = {
    options: snapOptions,
    currentRange: cr,
    activeRange: ar,
    viewDates: vd,
    intlTitle: intlT,
    viewTitle: vt,
    view: v,
    filteredEvents: fe,
    fire: () => {}, // snapshots are non-interactive
  };

  const noopUnsub = () => {};
  return {
    get(key) {
      return key in overrides ? overrides[key] : parent.get(key);
    },
    set() { /* no-op */ },
    on() { return noopUnsub; },
    onAny() { return noopUnsub; },
    snapshot() { return { ...parent.snapshot(), ...overrides }; },
    destroy() { /* no-op */ },
  };
}

function el(tag, className, attrs = {}) {
  const node = document.createElement(tag);
  node.className = className;
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  return node;
}

function mod3(n) {
  return ((n % 3) + 3) % 3;
}
