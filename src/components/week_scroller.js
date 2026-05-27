// WeekScroller — continuous horizontal scroll across multiple TimeGrid
// weeks. Analogous to MonthScroller for `dayGridMonth +
// continuousMonthScroll: true`, but for TimeGridWeek. Each "page" is a
// full TimeGrid week rendered into its own slot; CSS scroll-snap glues
// the user to one week at a time, scroll-settle updates options.date
// to the centred week, and lazy edges keep adding weeks as the user
// scrolls past them.
//
// Activated by `options.continuousWeekScroll: true` in the controller.
// Renders entirely separate from the Pager — when this scroller is on,
// the Pager isn't mounted at all.

import { createElement } from '../lib/dom.js';
import {
  cloneDate, addDay, setMidnight, createDate,
} from '../lib/date.js';

const PAGES_BACK = 4;
const PAGES_AHEAD = 8;
const EXTEND_PAGES = 4;
const EXTEND_THRESHOLD_PX = 600;
const SCROLL_SETTLE_MS = 160;

// createWeekScroller(container, state, viewFactory, { onDateChange })
//
// container    — mainEl
// state        — live MainState
// viewFactory  — the same factory the controller hands the Pager
//                (e.g. (state) => renderTimeGridView). Each page calls it
//                with a fresh state-like wrapper limited to that page's
//                activeRange / viewDates.
// onDateChange — bridge to setOption('date', d). Fires (debounced) when
//                the snap-centred week changes.
export function createWeekScroller(container, state, viewFactory, { onDateChange }) {
  const root = createElement('div', 'ec-week-scroller');
  const track = createElement('div', 'ec-week-scroller-track');
  root.append(track);
  container.replaceChildren(root);

  // Pages are keyed by the week-start UTC-midnight date.
  // Each page: { weekStart, el, render, teardown }
  const pages = new Map();
  let pageWidth = 0;

  const anchor = weekStartFor(state.get('options').date, state.get('options').firstDay ?? 0);
  for (let i = -PAGES_BACK; i <= PAGES_AHEAD; ++i) appendPageForOffset(i);

  // Re-measure after the first frame so we can snap to the anchor week.
  requestAnimationFrame(() => {
    pageWidth = root.clientWidth || track.firstElementChild?.clientWidth || 0;
    if (!pageWidth) return;
    const anchorPage = pages.get(keyOf(anchor));
    if (!anchorPage) return;
    suppressScroll = true;
    const prevBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = 'auto';
    root.scrollLeft = anchorPage.el.offsetLeft;
    root.style.scrollBehavior = prevBehavior || '';
    requestAnimationFrame(() => { suppressScroll = false; });
  });

  // Snap-detect + lazy extend on scroll.
  let suppressScroll = false;
  let settleTimer = null;
  const onScroll = () => {
    if (suppressScroll) return;
    // Extend forward / backward when the user nears the edges.
    if (root.scrollWidth - (root.scrollLeft + root.clientWidth) < EXTEND_THRESHOLD_PX) {
      for (let i = 0; i < EXTEND_PAGES; ++i) {
        const last = lastPage();
        if (!last) break;
        appendPageForOffset(offsetOf(last.weekStart) + 1);
      }
    }
    if (root.scrollLeft < EXTEND_THRESHOLD_PX) {
      const oldWidth = root.scrollWidth;
      const oldScrollLeft = root.scrollLeft;
      for (let i = 0; i < EXTEND_PAGES; ++i) {
        const first = firstPage();
        if (!first) break;
        prependPageForOffset(offsetOf(first.weekStart) - 1);
      }
      // Compensate scrollLeft for the prepended widths so the visible
      // page doesn't jump.
      suppressScroll = true;
      const grew = root.scrollWidth - oldWidth;
      root.scrollLeft = oldScrollLeft + grew;
      requestAnimationFrame(() => { suppressScroll = false; });
    }
    clearTimeout(settleTimer);
    settleTimer = setTimeout(onSettled, SCROLL_SETTLE_MS);
  };
  root.addEventListener('scroll', onScroll, { passive: true });

  function onSettled() {
    if (suppressScroll || !pageWidth) return;
    // The page nearest the centre of the viewport wins.
    const centre = root.scrollLeft + root.clientWidth / 2;
    let best = null, bestDist = Infinity;
    for (const p of pages.values()) {
      const pageCentre = p.el.offsetLeft + p.el.offsetWidth / 2;
      const d = Math.abs(pageCentre - centre);
      if (d < bestDist) { bestDist = d; best = p; }
    }
    if (!best) return;
    const currentOpt = state.get('options').date;
    const currentWeekStart = weekStartFor(currentOpt, state.get('options').firstDay ?? 0);
    if (datesEqualUTC(best.weekStart, currentWeekStart)) return;
    suppressScroll = true;
    // Mid-week (Wednesday) so a user landing on a partial-week view
    // gets a stable anchor regardless of firstDay.
    const mid = cloneDate(best.weekStart);
    addDay(mid, 3);
    const localMid = new Date(mid.getUTCFullYear(), mid.getUTCMonth(), mid.getUTCDate());
    onDateChange?.(localMid);
    requestAnimationFrame(() => { suppressScroll = false; });
  }

  // Re-render every page's events when filteredEvents change. The
  // page's internal renderer already subscribes to its state-wrapper —
  // so we just rebuild the wrapper to point at the live shared state.
  const off = state.onAny(({ key }) => {
    if (key !== 'filteredEvents') return;
    for (const p of pages.values()) p.render?.();
  });

  // -- helpers ----------------------------------------------------------

  function weekStartFor(date, firstDay) {
    const d = setMidnight(createDate(date));
    const dow = d.getUTCDay();
    const back = (dow - firstDay + 7) % 7;
    addDay(d, -back);
    return d;
  }
  function keyOf(date) { return date.toISOString().substring(0, 10); }
  function offsetOf(weekStart) {
    return Math.round((weekStart.getTime() - anchor.getTime()) / (7 * 86400000));
  }
  function datesEqualUTC(a, b) { return a?.getTime?.() === b?.getTime?.(); }
  function firstPage() {
    let first = null;
    for (const p of pages.values()) if (!first || p.weekStart < first.weekStart) first = p;
    return first;
  }
  function lastPage() {
    let last = null;
    for (const p of pages.values()) if (!last || p.weekStart > last.weekStart) last = p;
    return last;
  }

  function buildPage(weekStart) {
    const slot = createElement('div', 'ec-week-scroller-page');
    slot.style.scrollSnapAlign = 'start';
    slot.dataset.weekStart = keyOf(weekStart);

    // Build a derived state that fakes a single-week activeRange around
    // weekStart for this page. The view factory reads activeRange /
    // viewDates / filteredEvents and renders into the slot.
    let teardown = null;
    const renderPage = () => {
      const pageState = makePageState(state, weekStart);
      teardown?.();
      teardown = viewFactory?.(slot, pageState) ?? null;
    };
    renderPage();
    return { weekStart, el: slot, render: renderPage, teardown: () => teardown?.() };
  }

  function appendPageForOffset(off) {
    const ws = cloneDate(anchor);
    addDay(ws, off * 7);
    const k = keyOf(ws);
    if (pages.has(k)) return;
    const page = buildPage(ws);
    track.append(page.el);
    pages.set(k, page);
  }
  function prependPageForOffset(off) {
    const ws = cloneDate(anchor);
    addDay(ws, off * 7);
    const k = keyOf(ws);
    if (pages.has(k)) return;
    const page = buildPage(ws);
    track.insertBefore(page.el, track.firstChild);
    pages.set(k, page);
  }

  return {
    destroy() {
      off?.();
      clearTimeout(settleTimer);
      for (const p of pages.values()) p.teardown?.();
      pages.clear();
      container.replaceChildren();
    },
  };
}

// Wrap the live state with a derived activeRange / currentRange /
// viewDates that target a single week. Mutations on this state-wrap
// are SCOPED to the page's renderer — they don't leak back into the
// shared store. Listeners on the shared store are forwarded though, so
// upstream changes (options, events) repaint the page.
function makePageState(state, weekStart) {
  const wsClone = cloneDate(weekStart);
  const end = cloneDate(weekStart); addDay(end, 7);

  const pageOverrides = new Map();
  pageOverrides.set('activeRange',  { start: wsClone, end });
  pageOverrides.set('currentRange', { start: wsClone, end });
  pageOverrides.set('viewDates',    enumerateWeek(wsClone));

  const listeners = new Map(); // key -> Set<fn>

  const wrap = {
    get(key) {
      if (pageOverrides.has(key)) return pageOverrides.get(key);
      return state.get(key);
    },
    set(key, value) {
      pageOverrides.set(key, value);
      const set = listeners.get(`change:${key}`);
      if (set) for (const fn of set) fn({ key, value });
    },
    on(eventName, fn) {
      let set = listeners.get(eventName);
      if (!set) { set = new Set(); listeners.set(eventName, set); }
      set.add(fn);
      const upstream = state.on?.(eventName, (ev) => {
        // Don't shadow the page's local activeRange/currentRange/viewDates
        // when upstream broadcasts changes to them — the page is locked
        // to its week.
        const key = ev.key;
        if (['activeRange','currentRange','viewDates'].includes(key)) return;
        fn(ev);
      });
      return () => { set.delete(fn); upstream?.(); };
    },
    onAny(fn) {
      // Upstream subscription that filters out the page-local overrides.
      const upstream = state.onAny?.((ev) => {
        if (['activeRange','currentRange','viewDates'].includes(ev.key)) return;
        fn(ev);
      });
      return upstream;
    },
  };
  return wrap;
}

function enumerateWeek(weekStart) {
  const out = [];
  const d = cloneDate(weekStart);
  for (let i = 0; i < 7; ++i) { out.push(cloneDate(d)); addDay(d); }
  return out;
}
