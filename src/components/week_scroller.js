// WeekScroller — continuous horizontal day strip on TimeGridWeek.
//
// Replaces the standard Pager carousel with ONE TimeGrid view that
// renders a wide range of days (initially 7 weeks centered on
// options.date). The user scrolls horizontally through the day strip;
// there is exactly one sidebar (sticky-left), one header, one all-day
// row, one body. Day columns are virtual in the sense that the range
// auto-extends when the user scrolls within EXTEND_THRESHOLD_PX of
// either edge — the renderer re-runs with a wider activeRange and
// the scroll position is preserved.
//
// CSS class `.ec-continuous-time-grid` (applied to a wrapper around
// the rendered TimeGrid) flips TimeGrid's column-template from
// equal-fr to fixed-width and makes the root the horizontal scroll
// container with sticky-left sidebar + sticky-top header.
//
// Activated by `options.continuousWeekScroll: true` on a timeGridWeek
// view. The controller bypasses the Pager when this option is on.

import {
  addDay, cloneDate, setMidnight, createDate, datesEqual,
} from '../lib/date.js';

// Initial range width (in weeks) — start with this many weeks centered
// on options.date. Extended on demand as the user scrolls.
const INITIAL_WEEKS = 7;
const EXTEND_WEEKS = 4;
const EXTEND_THRESHOLD_PX = 600;
const SCROLL_SETTLE_MS = 180;

// createWeekScroller(container, state, viewFactory, { onDateChange })
//
// container    — mainEl
// state        — live MainState
// viewFactory  — renderTimeGridView (or any (container, pageState) => teardown)
// onDateChange — bridge to setOption('date', d). Fires (debounced) when
//                the day at the viewport-centre changes.
export function createWeekScroller(container, state, viewFactory, { onDateChange }) {
  // Wrapper that establishes the horizontal-scroll context + carries
  // the continuous-mode CSS class. Sets --ec-col-w at the top of the
  // cascade so the continuous CSS rules on header / all-day / body all
  // see the fixed-width tracks (TimeGrid only sets --ec-col-w on the
  // .ec-days child, which doesn't reach the parent rows).
  const root = document.createElement('div');
  root.className = 'ec-continuous-time-grid';
  root.style.setProperty('--ec-col-w', `${140}px`);
  container.replaceChildren(root);

  const firstDay = state.get('options').firstDay ?? 0;
  let rangeStart = weekStartFor(state.get('options').date, firstDay);
  addDay(rangeStart, -Math.floor(INITIAL_WEEKS / 2) * 7);
  let rangeEnd = cloneDate(rangeStart);
  addDay(rangeEnd, INITIAL_WEEKS * 7);

  let teardown = null;
  let suppressScroll = false;
  let settleTimer = null;
  let columnWidth = 140;

  function renderRange() {
    teardown?.();
    root.style.setProperty('--ec-col-w', `${columnWidth}px`);
    const pageState = makePageState(state, rangeStart, rangeEnd, columnWidth);
    teardown = viewFactory(root, pageState);
  }

  renderRange();

  // Centre the anchor day in the viewport on first render.
  requestAnimationFrame(() => {
    const anchor = setMidnight(createDate(state.get('options').date));
    centreDay(anchor);
  });

  function centreDay(date) {
    const dayIdx = dayIndexOf(date);
    if (dayIdx < 0) return;
    const sidebarPx = sidebarWidth();
    const targetScroll = Math.max(
      0,
      dayIdx * columnWidth + sidebarPx - (root.clientWidth - columnWidth) / 2,
    );
    suppressScroll = true;
    root.scrollLeft = targetScroll;
    requestAnimationFrame(() => { suppressScroll = false; });
  }

  function dayIndexOf(date) {
    const target = setMidnight(cloneDate(date));
    let i = 0;
    const cursor = cloneDate(rangeStart);
    while (cursor < rangeEnd) {
      if (datesEqual(cursor, target)) return i;
      addDay(cursor);
      ++i;
    }
    return -1;
  }

  function sidebarWidth() {
    const sb = root.querySelector('.ec-time-grid .ec-sidebar');
    return sb?.getBoundingClientRect().width || 64;
  }

  const onScroll = () => {
    if (suppressScroll) return;
    maybeExtend();
    clearTimeout(settleTimer);
    settleTimer = setTimeout(onSettled, SCROLL_SETTLE_MS);
  };
  root.addEventListener('scroll', onScroll, { passive: true });

  function maybeExtend() {
    const scrollLeft = root.scrollLeft;
    const viewW = root.clientWidth;
    const scrollW = root.scrollWidth;

    if (scrollW - (scrollLeft + viewW) < EXTEND_THRESHOLD_PX) {
      // Extend forward (right): rangeEnd += EXTEND_WEEKS weeks. Existing
      // DOM stays put, no scrollLeft adjustment needed.
      const oldEnd = cloneDate(rangeEnd);
      addDay(rangeEnd, EXTEND_WEEKS * 7);
      suppressScroll = true;
      renderRange();
      requestAnimationFrame(() => { suppressScroll = false; });
      void oldEnd;
      return;
    }
    if (scrollLeft < EXTEND_THRESHOLD_PX) {
      // Extend backward (left): rangeStart -= EXTEND_WEEKS weeks. The
      // existing day cols shift right by (EXTEND_WEEKS*7 * columnWidth);
      // bump scrollLeft by the same delta so the user's view stays
      // anchored on the same day.
      addDay(rangeStart, -EXTEND_WEEKS * 7);
      const oldScroll = scrollLeft;
      const oldWidth = scrollW;
      suppressScroll = true;
      renderRange();
      requestAnimationFrame(() => {
        const grew = root.scrollWidth - oldWidth;
        root.scrollLeft = oldScroll + grew;
        suppressScroll = false;
      });
    }
  }

  function onSettled() {
    if (suppressScroll) return;
    // The day under the viewport-centre wins.
    const sidebarPx = sidebarWidth();
    const centreX = root.scrollLeft + root.clientWidth / 2;
    const dayOffset = Math.floor((centreX - sidebarPx) / columnWidth);
    if (dayOffset < 0) return;
    const centred = cloneDate(rangeStart);
    addDay(centred, dayOffset);
    const currentOpt = state.get('options').date;
    const currentMid = setMidnight(createDate(currentOpt));
    if (datesEqual(centred, currentMid)) return;
    suppressScroll = true;
    const localMid = new Date(centred.getUTCFullYear(), centred.getUTCMonth(), centred.getUTCDate());
    onDateChange?.(localMid);
    requestAnimationFrame(() => { suppressScroll = false; });
  }

  // External date change (Today / gotoDate / toolbar prev-next) →
  // jump the scroll to centre the new date. If the date is outside
  // the current range, re-anchor and render fresh.
  const dateSub = state.on('change:options', () => {
    if (suppressScroll) return;
    const newDate = setMidnight(createDate(state.get('options').date));
    if (newDate < rangeStart || newDate >= rangeEnd) {
      rangeStart = weekStartFor(newDate, firstDay);
      addDay(rangeStart, -Math.floor(INITIAL_WEEKS / 2) * 7);
      rangeEnd = cloneDate(rangeStart);
      addDay(rangeEnd, INITIAL_WEEKS * 7);
      renderRange();
      requestAnimationFrame(() => centreDay(newDate));
    } else {
      centreDay(newDate);
    }
  });

  // Re-render when filteredEvents change.
  const off = state.onAny(({ key }) => {
    if (key === 'filteredEvents') {
      // Preserve scroll position across the re-render.
      const sl = root.scrollLeft;
      const st = root.scrollTop;
      suppressScroll = true;
      renderRange();
      requestAnimationFrame(() => {
        root.scrollLeft = sl;
        root.scrollTop = st;
        suppressScroll = false;
      });
    }
  });

  return {
    destroy() {
      off?.();
      dateSub?.();
      clearTimeout(settleTimer);
      teardown?.();
      container.replaceChildren();
    },
  };
}

// ---- helpers ---------------------------------------------------------

function weekStartFor(date, firstDay) {
  const d = setMidnight(createDate(date));
  const dow = d.getUTCDay();
  const back = (dow - firstDay + 7) % 7;
  addDay(d, -back);
  return d;
}

// Wrap the live state with a derived activeRange / currentRange /
// viewDates that target the wide [rangeStart, rangeEnd) span. Mutations
// scoped to the renderer; upstream listeners still bubble through for
// option / event changes.
function makePageState(state, rangeStart, rangeEnd, colWidth) {
  const rs = cloneDate(rangeStart);
  const re = cloneDate(rangeEnd);
  const days = [];
  const cursor = cloneDate(rs);
  while (cursor < re) { days.push(cloneDate(cursor)); addDay(cursor); }

  const overrides = new Map();
  overrides.set('activeRange',  { start: rs, end: re });
  overrides.set('currentRange', { start: rs, end: re });
  overrides.set('viewDates',    days);

  // Wider columnWidth via a derived options object — TimeGrid reads
  // options.columnWidth to set --ec-col-w on the cols wrap, which the
  // continuous CSS uses for fixed-width tracks.
  const baseOpts = state.get('options');
  const optOverride = { ...baseOpts, columnWidth: colWidth };
  overrides.set('options', optOverride);

  const listeners = new Map();
  const wrap = {
    get(key) {
      if (overrides.has(key)) return overrides.get(key);
      return state.get(key);
    },
    set(key, value) {
      overrides.set(key, value);
      const set = listeners.get(`change:${key}`);
      if (set) for (const fn of set) fn({ key, value });
    },
    on(eventName, fn) {
      let set = listeners.get(eventName);
      if (!set) { set = new Set(); listeners.set(eventName, set); }
      set.add(fn);
      const upstream = state.on?.(eventName, (ev) => {
        if (['activeRange', 'currentRange', 'viewDates', 'options'].includes(ev.key)) return;
        fn(ev);
      });
      return () => { set.delete(fn); upstream?.(); };
    },
    onAny(fn) {
      return state.onAny?.((ev) => {
        if (['activeRange', 'currentRange', 'viewDates', 'options'].includes(ev.key)) return;
        fn(ev);
      });
    },
  };
  return wrap;
}
