// Pager — macOS-Calendar-style swipe navigation between adjacent date
// pages. Wraps the view factory in a three-page carousel; pre-renders
// the previous and next date pages lazily on first gesture, follows the
// finger/pointer/wheel with a translate3d transform, snaps to the
// nearest page on release, and commits the navigation by setting
// options.date through the public API. The same pipeline backs:
//
//   - touch swipe + mouse drag (Pointer Events)
//   - trackpad horizontal scroll (deltaX accumulation)
//   - keyboard left/right arrows (instant nav, no animation)
//
// The pager subscribes to nothing — the controller still owns
// _mountView, so a date change re-enters _mountView which destroys the
// pager and rebuilds it with the new center page. The visual
// continuity comes from: by the time the new pager renders, the
// snapshot of the destination date is already on screen (animated into
// place) and the live render lands in the same DOM position the
// snapshot occupied.

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

const SWIPE_THRESHOLD_FRACTION = 0.25;
const SWIPE_THRESHOLD_MAX = 140;
const SWIPE_ANIM_MS = 240;
const SWIPE_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
const VERTICAL_GUARD = 6;
const WHEEL_END_DEBOUNCE = 160;
const WHEEL_THRESHOLD_FRACTION = 0.35;
const WHEEL_THRESHOLD_MAX = 200;

// createPager(container, state, factory, { onNavigate }) → { destroy }
//
//   container — the calendar's main view slot (this._mainEl)
//   state     — the live MainState (so the center view stays fully reactive)
//   factory   — the view component factory returned by setViewOptions
//   onNavigate({ direction, date }) — fires after the swipe completes; the
//     handler should call the calendarApi.next() / prev() / gotoDate(date)
//     to actually advance the view.
export function createPager(container, state, factory, { onNavigate }) {
  const pager = el('div', 'ec-pager', { tabindex: '0' });
  const track = el('div', 'ec-pager-track');
  const prevPage = el('div', 'ec-pager-page ec-pager-page-prev', { 'aria-hidden': 'true' });
  const currentPage = el('div', 'ec-pager-page ec-pager-page-current');
  const nextPage = el('div', 'ec-pager-page ec-pager-page-next', { 'aria-hidden': 'true' });
  track.append(prevPage, currentPage, nextPage);
  pager.append(track);
  container.replaceChildren(pager);

  // Mount the live view inside the centre page. The view's own onAny
  // subscriptions stay wired to the parent state — small mutations
  // (e.g. addEvent) re-render in place without recreating the pager.
  let liveTeardown = factory(currentPage, state);

  // Snapshot teardowns — built on first gesture, cleared once the
  // gesture commits or cancels.
  let prevTeardown = null;
  let nextTeardown = null;

  function ensureSnapshots() {
    const options = state.get('options');
    const inc = options.dateIncrement ?? options.duration;
    if (!inc) return;

    if (!prevTeardown) {
      const date = subtractDuration(cloneDate(options.date), inc);
      const snapState = createSnapshotState(state, date);
      prevPage.replaceChildren();
      prevTeardown = factory(prevPage, snapState);
    }
    if (!nextTeardown) {
      const date = addDuration(cloneDate(options.date), inc);
      const snapState = createSnapshotState(state, date);
      nextPage.replaceChildren();
      nextTeardown = factory(nextPage, snapState);
    }
  }

  function clearSnapshots() {
    if (prevTeardown) { prevTeardown(); prevTeardown = null; prevPage.replaceChildren(); }
    if (nextTeardown) { nextTeardown(); nextTeardown = null; nextPage.replaceChildren(); }
  }

  function setTransform(px, animate) {
    track.style.transition = animate
      ? `transform ${SWIPE_ANIM_MS}ms ${SWIPE_EASE}`
      : 'none';
    track.style.transform = `translate3d(${px}px, 0, 0)`;
  }

  // --- pointer (touch + mouse) ------------------------------------------

  let drag = null; // { startX, startY, pointerId, decided, abandoned }

  function onPointerDown(ev) {
    if (drag || wheelGesture) return;
    if (ev.button !== undefined && ev.button !== 0) return;
    // Skip gestures that start on something interactive — chips, resizers,
    // expanders, more-links, buttons.
    if (ev.target.closest?.('[data-event-id], [data-more-link], [data-popover-action], .ec-resizer, .ec-pager-no-swipe, .ec-button, button, input, select, textarea, a')) return;
    drag = {
      startX: ev.clientX, startY: ev.clientY,
      pointerId: ev.pointerId, decided: false, abandoned: false,
    };
    document.addEventListener('pointermove', onPointerMove, { passive: false });
    document.addEventListener('pointerup', onPointerUp);
    document.addEventListener('pointercancel', onPointerUp);
  }

  function onPointerMove(ev) {
    if (!drag || drag.abandoned) return;
    const dx = ev.clientX - drag.startX;
    const dy = ev.clientY - drag.startY;
    if (!drag.decided) {
      // If the user moves mostly vertically first, let the browser scroll
      // and don't hijack the gesture.
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
    if (!drag) return;
    const d = drag; drag = null;
    document.removeEventListener('pointermove', onPointerMove);
    document.removeEventListener('pointerup', onPointerUp);
    document.removeEventListener('pointercancel', onPointerUp);
    pager.classList.remove('ec-pager-dragging');
    if (!d.decided || d.abandoned) {
      setTransform(0, false);
      return;
    }
    const dx = (ev?.clientX ?? d.startX) - d.startX;
    const width = pager.offsetWidth || container.offsetWidth || 1;
    const threshold = Math.min(width * SWIPE_THRESHOLD_FRACTION, SWIPE_THRESHOLD_MAX);
    if (dx <= -threshold) {
      animateAndCommit(-width, +1);
    } else if (dx >= threshold) {
      animateAndCommit(+width, -1);
    } else {
      setTransform(0, true);
      // Snapshots can stay — next gesture will reuse them.
    }
  }

  // --- wheel / trackpad --------------------------------------------------

  let wheelGesture = null; // { acc, endTimer }
  let wheelCleanupTimer = null;

  function onWheel(ev) {
    if (drag) return;
    // Two-finger horizontal scroll on macOS sets deltaX, deltaY ≈ 0.
    // Plain vertical wheel passes through to the browser.
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
      const g = wheelGesture; wheelGesture = null;
      pager.classList.remove('ec-pager-dragging');
      clearTimeout(g.endTimer);
      animateAndCommit(-width, +1);
    } else if (wheelGesture.acc >= threshold) {
      const g = wheelGesture; wheelGesture = null;
      pager.classList.remove('ec-pager-dragging');
      clearTimeout(g.endTimer);
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
    wheelCleanupTimer = setTimeout(clearSnapshots, 1500);
  }

  // --- keyboard ---------------------------------------------------------

  function onKeyDown(ev) {
    if (ev.target !== pager && !pager.contains(ev.target)) return;
    if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
    if (ev.target.matches?.('input, textarea, select, [contenteditable="true"]')) return;
    if (ev.key === 'ArrowLeft')  { ev.preventDefault(); onNavigate?.({ direction: -1 }); }
    else if (ev.key === 'ArrowRight') { ev.preventDefault(); onNavigate?.({ direction: +1 }); }
  }

  function animateAndCommit(toPx, direction) {
    setTransform(toPx, true);
    setTimeout(() => onNavigate?.({ direction }), SWIPE_ANIM_MS);
    // Snapshots are torn down when the pager itself is destroyed by the
    // controller's _mountView callback.
  }

  pager.addEventListener('pointerdown', onPointerDown);
  pager.addEventListener('wheel', onWheel, { passive: false });
  pager.addEventListener('keydown', onKeyDown);

  return {
    destroy() {
      try { if (liveTeardown) liveTeardown(); } catch { /* ignore */ }
      clearSnapshots();
      clearTimeout(wheelCleanupTimer);
      pager.removeEventListener('pointerdown', onPointerDown);
      pager.removeEventListener('wheel', onWheel);
      pager.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
      document.removeEventListener('pointercancel', onPointerUp);
      container.replaceChildren();
    },
    // Test helper — surfaces the inner DOM nodes without coupling tests
    // to the class names directly.
    _nodes() { return { pager, track, prevPage, currentPage, nextPage }; },
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
