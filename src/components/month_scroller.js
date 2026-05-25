// MonthScroller — macOS-Calendar-style continuous vertical scroll of
// months. Instead of paginating between month grids, we stack week rows
// across many months in a single scrollable column. Each row that starts
// a new month gets a big "Month Year" banner overlaid on its first
// day-number cell, exactly like macOS Calendar.
//
// The scroller mounts:
//   - one sticky day-of-week header row (Sun..Sat)
//   - N week rows below it (initial range = current month ± 6 months)
//   - automatic lazy extension when the user scrolls within 600px of the
//     top or bottom edge
//
// The current "anchor" month is whatever options.date points at on mount,
// and the scroller centres that month in the viewport. On settled scroll
// (debounced 140ms), the visible centre week's first-day month becomes
// the new options.date — so the toolbar's title pill and the rest of the
// app stay in sync with what the user is looking at.

import { createElement } from '../lib/dom.js';
import {
  cloneDate, addDay, addDuration, subtractDuration, datesEqual,
  prevClosestDay, setMidnight, createDate,
} from '../lib/date.js';
import { createDuration } from '../lib/duration.js';

const EXTEND_THRESHOLD_PX = 600;
const SCROLL_SETTLE_MS = 140;
const MONTHS_PER_EXTEND = 3;
const INITIAL_MONTHS_AHEAD = 12;
// When validRange.start is set we don't render any week earlier than it
// (no past months in a forward-only calendar). When validRange.start is
// undefined we still render INITIAL_MONTHS_BEHIND months behind the
// anchor so users can scroll back if they want to.
const INITIAL_MONTHS_BEHIND = 0;

// createMonthScroller(container, state, { onDateChange })
//
// container — main view slot (this._mainEl)
// state     — the live MainState
// onDateChange(newDate) — called (debounced) when the scroller's
//   "centred" month moves; the controller bridges this to setOption('date', d).
export function createMonthScroller(container, state, { onDateChange }) {
  const scroller = createElement('div', 'ec-month-scroller');
  const head = createElement('div', 'ec-month-scroller-head');
  const body = createElement('div', 'ec-month-scroller-body');
  scroller.append(head, body);
  container.replaceChildren(scroller);

  // Sun..Sat header — respects options.firstDay.
  renderWeekdayHeader(head, state);

  // Week-row list. weekRows[i] = { rowEl, weekStart (UTC midnight Date),
  // monthAnchor (Date — the 1st of the month for label rendering, or null
  // if this row doesn't start a new month) }.
  let weekRows = [];

  // Initial range. When options.validRange.start is set, the scroller
  // refuses to render any week earlier than it (forward-only calendar).
  // Otherwise it seeds INITIAL_MONTHS_BEHIND months behind the anchor
  // so users can scroll backwards.
  const anchor = startOfMonth(cloneDate(state.get('options').date));
  const validStart = state.get('options').validRange?.start;
  const initStart = validStart
    ? setMidnight(cloneDate(validStart))
    : (() => {
        const d = startOfMonth(cloneDate(anchor));
        d.setUTCMonth(d.getUTCMonth() - INITIAL_MONTHS_BEHIND);
        return d;
      })();
  const initEnd = startOfMonth(cloneDate(anchor));
  initEnd.setUTCMonth(initEnd.getUTCMonth() + INITIAL_MONTHS_AHEAD);
  buildWeeks(body, initStart, initEnd, weekRows, state);

  // Centre the anchor month in the viewport on mount. We match by
  // month-and-year, not by exact monthAnchor date — refreshBanners()
  // places monthAnchor on the row's first day, which is rarely the 1st
  // of the month (e.g. for May 2026, monthAnchor is the Sunday May 3).
  // Disable smooth scroll for the seed so scrollTop lands instantly
  // (otherwise the settled-scroll handler fires repeatedly during the
  // smooth animation and snaps options.date to whichever month happens
  // to pass through the centre line first).
  requestAnimationFrame(() => {
    const target = weekRows.find((r) =>
      r.monthAnchor
      && r.monthAnchor.getUTCFullYear() === anchor.getUTCFullYear()
      && r.monthAnchor.getUTCMonth() === anchor.getUTCMonth(),
    );
    if (target) {
      const desired = target.rowEl.offsetTop - 12;
      const prevBehavior = body.style.scrollBehavior;
      body.style.scrollBehavior = 'auto';
      body.scrollTop = Math.max(0, desired);
      void body.offsetTop;
      body.style.scrollBehavior = prevBehavior || '';
    }
    body.addEventListener('scroll', onScroll, { passive: true });
  });

  // Day cell click semantics (macOS Calendar parity):
  //   - single click on a day cell  → select that day (sets options.date,
  //     highlights the cell). Doesn't fire dateClick so demo apps don't
  //     accidentally prompt for a new event on every single click.
  //   - double click on a day cell  → fires dateClick — the host app
  //     uses that to open a create-event modal / prompt.
  //   - single click on an event chip → eventClick already fires from
  //     the per-chip handler in renderEvents(); we just skip the cell
  //     handler here so the chip's click isn't double-counted as a day
  //     select.
  // We use a single-click → SELECT, double-click → dateClick model in
  // the month scroller. The Interaction plugin also listens for clicks
  // on [data-date] at the calendar root and would fire dateClick on
  // every single click — which the demo turns into "prompt for event
  // title". stopPropagation here keeps the interaction plugin out of
  // the month scroller so single clicks only select.
  body.addEventListener('click', (ev) => {
    if (ev.target.closest('[data-event-id], [data-more-link]')) return;
    const cell = ev.target.closest('.ec-month-scroller-cell');
    if (!cell) return;
    ev.stopPropagation();
    const dateStr = cell.getAttribute('data-date');
    if (!dateStr) return;
    body.querySelectorAll('.ec-month-scroller-cell.ec-selected')
        .forEach((c) => c.classList.remove('ec-selected'));
    cell.classList.add('ec-selected');
    emitDateChange(new Date(dateStr + 'T00:00:00Z'));
  });
  body.addEventListener('dblclick', (ev) => {
    if (ev.target.closest('[data-event-id], [data-more-link]')) return;
    const cell = ev.target.closest('.ec-month-scroller-cell');
    if (!cell) return;
    ev.stopPropagation();
    const dateStr = cell.getAttribute('data-date');
    if (!dateStr) return;
    state.get('fire')?.('dateClick', {
      date: new Date(dateStr + 'T00:00:00Z'),
      dateStr,
      allDay: true,
      jsEvent: ev,
      view: state.get('view'),
    });
  });

  // Re-render events when state changes.
  let renderTimer = null;
  const off = state.onAny(({ key }) => {
    if (['filteredEvents', 'currentRange', 'activeRange', 'options'].includes(key)) {
      // Coalesce bursts.
      if (renderTimer) return;
      renderTimer = setTimeout(() => {
        renderTimer = null;
        renderEvents(weekRows, state, emitDateChange);
      }, 0);
    }
  });
  renderEvents(weekRows, state, emitDateChange);

  // When the date changes via something OTHER than the scroller's own
  // scroll (Today button, gotoDate, external setOption('date', ...)),
  // jump the scroll position so the requested month is centred. The
  // suppressOnDateChange flag stops the resulting scroll from looping
  // back through onScrollSettled → onDateChange → here.
  const rangeSub = state.on('change:currentRange', () => {
    if (suppressOnDateChange) return;
    const date = state.get('options').date;
    if (!date) return;
    // External date change (Today button, gotoDate) → bring the MONTH
    // into view by placing the row that carries this month's banner at
    // the top of the viewport. Today's week sits a few rows down so
    // it's still visible without being pinned to the top. (Internal
    // scroll-driven date updates are filtered out by emitDateChange()
    // setting suppressOnDateChange before the change propagates.)
    const target = startOfMonth(cloneDate(date));
    const findByMonth = () => weekRows.find((r) =>
      r.monthAnchor
      && r.monthAnchor.getUTCFullYear() === target.getUTCFullYear()
      && r.monthAnchor.getUTCMonth() === target.getUTCMonth(),
    );
    let row = findByMonth();
    if (!row) {
      const tooLate = weekRows[weekRows.length - 1]?.weekStart && weekRows[weekRows.length - 1].weekStart < target;
      const tooEarly = weekRows[0]?.weekStart && weekRows[0].weekStart > target;
      if (tooLate) {
        while (weekRows[weekRows.length - 1].weekStart < target) extendForward();
      } else if (tooEarly) {
        while (weekRows[0].weekStart > target) {
          const before = weekRows[0].weekStart;
          extendBackward();
          if (weekRows[0].weekStart >= before) break; // hit validRange.start guard
        }
      }
      row = findByMonth();
    }
    if (!row) return;
    suppressOnDateChange = true;
    const prevBehavior = body.style.scrollBehavior;
    body.style.scrollBehavior = 'auto';
    body.scrollTop = Math.max(0, row.rowEl.offsetTop - 12);
    body.style.scrollBehavior = prevBehavior || '';
    requestAnimationFrame(() => { suppressOnDateChange = false; });
  });

  // emitDateChange — wraps onDateChange so the resulting change:currentRange
  // doesn't loop back into rangeSub and re-scroll the body away from where
  // the user already is. Used by every internal path that wants to set
  // options.date (scroll-settled, click-to-select, destroy-flush).
  function emitDateChange(date) {
    suppressOnDateChange = true;
    onDateChange?.(date);
    requestAnimationFrame(() => { suppressOnDateChange = false; });
  }

  // --------- scroll handling ---------

  let settleTimer = null;
  let suppressOnDateChange = false;
  // True when the current scroll position was set by something OTHER
  // than the user (initial mount centring, rangeSub jumping to a new
  // month after Today/gotoDate). False once the user scrolls themselves.
  // flushPendingDate uses this to decide whether to override options.date
  // on view-switch — if the scroll is from an external nav, the user's
  // intent IS options.date and we shouldn't replace it with whatever
  // row happens to be near the top.
  let scrollIsExternal = true;

  function onScroll() {
    if (!suppressOnDateChange) scrollIsExternal = false;
    // Extend bottom?
    if (body.scrollHeight - (body.scrollTop + body.clientHeight) < EXTEND_THRESHOLD_PX) {
      extendForward();
    }
    // Extend top?
    if (body.scrollTop < EXTEND_THRESHOLD_PX) {
      extendBackward();
    }
    clearTimeout(settleTimer);
    settleTimer = setTimeout(onScrollSettled, SCROLL_SETTLE_MS);
  }

  function currentCentreDate() {
    // Snap on a WEEK basis, not a month basis. Find the row at the top
    // of the viewport and return its weekStart so options.date follows
    // the user's actual scroll position — switching from month to week
    // view lands on the week the user was looking at, not on a
    // month-anchor that might be many weeks away. Settled-scroll never
    // forces a scrollTop change; only options.date is updated.
    const ref = body.scrollTop + body.clientHeight / 4;
    let row = null;
    for (const r of weekRows) {
      if (r.rowEl.offsetTop > ref) break;
      row = r;
    }
    row = row ?? weekRows[0];
    if (!row) return null;
    // Return the row's mid-week day (Wed-ish) so day-view fallback lands
    // mid-week rather than on a Sunday boundary, but the WEEK is what
    // matters for week-view destinations.
    const d = cloneDate(row.weekStart);
    addDay(d, 3);
    return d;
  }

  // Wait until scrollTop has been stable for STABLE_MS before treating
  // the scroll as settled — covers trackpad / touch inertia that keeps
  // firing scroll events for hundreds of ms after the user released.
  const STABLE_MS = 220;
  let lastScrollTop = 0;
  let stableCheckTimer = null;
  function onScrollSettled() {
    if (suppressOnDateChange) return;
    clearTimeout(stableCheckTimer);
    const start = body.scrollTop;
    stableCheckTimer = setTimeout(function poll() {
      const now = body.scrollTop;
      if (now !== lastScrollTop) {
        // scroll moved during the wait — inertia is still going. Reset.
        lastScrollTop = now;
        stableCheckTimer = setTimeout(poll, STABLE_MS);
        return;
      }
      const newDate = currentCentreDate();
      if (!newDate) return;
      const currentOption = state.get('options').date;
      if (Math.abs(newDate.getTime() - currentOption.getTime()) >= 86400000 / 2) {
        emitDateChange(newDate);
      }
    }, STABLE_MS);
    lastScrollTop = start;
  }

  function flushPendingDate() {
    // Called on destroy (view-switch) so any uncommitted scroll position
    // commits to options.date BEFORE the new view mounts. Without this,
    // switching from month → week immediately after a scroll lands the
    // week view on whatever options.date was when the scroll started.
    //
    // Skip when the scroll position was set externally (rangeSub jumped
    // to a Today / gotoDate target). Otherwise switching to Week
    // immediately after Today would override options.date with the
    // middle-row of the auto-scrolled month, not today's week.
    if (suppressOnDateChange) return;
    if (scrollIsExternal) return;
    const newDate = currentCentreDate();
    if (!newDate) return;
    const currentOption = state.get('options').date;
    if (Math.abs(newDate.getTime() - currentOption.getTime()) >= 86400000 / 2) {
      onDateChange?.(newDate);
    }
  }

  function extendForward() {
    const last = weekRows[weekRows.length - 1];
    if (!last) return;
    const newStart = addDuration(cloneDate(last.weekStart), createDuration({ weeks: 1 }));
    const newEnd = cloneDate(newStart);
    newEnd.setUTCMonth(newEnd.getUTCMonth() + MONTHS_PER_EXTEND);
    buildWeeks(body, newStart, newEnd, weekRows, state, { append: true });
    renderEvents(weekRows, state, emitDateChange);
  }

  function extendBackward() {
    const first = weekRows[0];
    if (!first) return;
    const validStart = state.get('options').validRange?.start;
    // Forward-only calendar — refuse to extend below validRange.start.
    if (validStart) {
      const limit = setMidnight(cloneDate(validStart));
      if (first.weekStart <= limit) return;
    }
    const newEnd = cloneDate(first.weekStart);
    const newStart = cloneDate(newEnd);
    newStart.setUTCMonth(newStart.getUTCMonth() - MONTHS_PER_EXTEND);
    // Don't extend earlier than validRange.start.
    if (validStart) {
      const limit = setMidnight(cloneDate(validStart));
      if (newStart < limit) newStart.setTime(limit.getTime());
    }
    // Snap to the first weekday of the user's firstDay setting.
    const fd = state.get('options').firstDay ?? 0;
    prevClosestDay(newStart, fd);
    // Capture the scroll-from-top so we can preserve scrollTop after the
    // DOM grows upwards.
    const oldHeight = body.scrollHeight;
    buildWeeks(body, newStart, newEnd, weekRows, state, { prepend: true });
    renderEvents(weekRows, state, emitDateChange);
    const newHeight = body.scrollHeight;
    suppressOnDateChange = true;
    body.scrollTop += newHeight - oldHeight;
    requestAnimationFrame(() => { suppressOnDateChange = false; });
  }

  // --------- public surface ---------

  return {
    destroy() {
      // Commit any pending scroll position so a view-switch lands on
      // the month the user was looking at, not on the stale date.
      flushPendingDate();
      off();
      rangeSub?.();
      clearTimeout(renderTimer);
      clearTimeout(settleTimer);
      body.removeEventListener('scroll', onScroll);
      container.replaceChildren();
    },
    // Test/debug helper.
    _state() { return { weekRows, body }; },
  };
}

// --- internals ---------------------------------------------------------

function renderWeekdayHeader(head, state) {
  const options = state.get('options');
  const theme = options.theme;
  const firstDay = options.firstDay ?? 0;
  const fmt = new Intl.DateTimeFormat(options.locale, { timeZone: 'UTC', weekday: 'short' });
  head.replaceChildren();
  for (let i = 0; i < 7; ++i) {
    const dow = (firstDay + i) % 7;
    // Use a known Sunday (1970-01-04 was a Sunday) as anchor.
    const d = new Date(Date.UTC(1970, 0, 4 + dow));
    const cell = createElement('div', `${theme.dayHead ?? 'ec-day-head'} ec-month-scroller-day-head`, fmt.format(d), [
      ['data-day', String(dow)],
    ]);
    head.append(cell);
  }
}

// Build week rows spanning [from, to). `to` is exclusive — the first week
// row will be the week containing `from`'s first-day; rows continue until
// the row's weekStart >= to.
function buildWeeks(body, from, to, weekRows, state, opts = {}) {
  const options = state.get('options');
  const theme = options.theme;
  const firstDay = options.firstDay ?? 0;

  // Snap `from` back to the previous firstDay so the first row is a full week.
  const weekStart = setMidnight(cloneDate(from));
  prevClosestDay(weekStart, firstDay);
  const stop = setMidnight(cloneDate(to));

  const newRows = [];
  while (weekStart < stop) {
    const days = enumerateWeekDays(weekStart);
    // Skip if this exact week is already in weekRows (de-dup at boundary).
    const exists = weekRows.find((r) => datesEqual(r.weekStart, weekStart));
    if (!exists) {
      const rowEl = createElement('div', 'ec-month-scroller-row', '', [
        ['data-week-start', toISODate(weekStart)],
      ]);
      const cells = createElement('div', 'ec-month-scroller-cells');
      const todayMid = setMidnight(new Date());
      for (const d of days) {
        const isToday = datesEqual(setMidnight(cloneDate(d)), todayMid);
        const cell = createElement('div',
          `${theme.day ?? 'ec-day'} ec-month-scroller-cell${isToday ? ' ec-today' : ''}`, '', [
            ['data-date', toISODate(d)],
          ]);
        const num = createElement('div', 'ec-day-number', String(d.getUTCDate()));
        cell.append(num);
        cells.append(cell);
      }
      rowEl.append(cells);
      // monthAnchor is assigned later by refreshBanners() based on the
      // row's position relative to its neighbours — a row gets a banner
      // only when its FIRST day is in a different month than the
      // previous row's first day, mirroring macOS Calendar (a partial
      // week that spills into a new month doesn't get the new-month
      // banner; only the next full row does).
      newRows.push({ rowEl, weekStart: cloneDate(weekStart), monthAnchor: null });
    }
    addDay(weekStart, 7);
  }

  if (opts.prepend) {
    // Insert at top, in order.
    for (let i = newRows.length - 1; i >= 0; --i) {
      body.insertBefore(newRows[i].rowEl, body.firstChild);
    }
    weekRows.unshift(...newRows);
  } else {
    for (const r of newRows) body.append(r.rowEl);
    weekRows.push(...newRows);
  }
  refreshBanners(weekRows, options);
}

// Walks weekRows in order, computes the canonical "month of this row" as
// the month of the row's first day, and adds / removes the
// .ec-month-scroller-month-banner whenever the month changes between
// adjacent rows.
function refreshBanners(weekRows, options) {
  const mfmt = new Intl.DateTimeFormat(options.locale, {
    timeZone: 'UTC', month: 'long', year: 'numeric',
  });
  let prevKey = null;
  for (const r of weekRows) {
    const d = r.weekStart;
    const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}`;
    const needs = key !== prevKey;
    const existing = r.rowEl.querySelector('.ec-month-scroller-month-banner');
    if (needs && !existing) {
      const banner = createElement('div', 'ec-month-scroller-month-banner', '');
      const parts = mfmt.formatToParts(d);
      const monthSpan = createElement('span', 'ec-month-scroller-month-name',
        parts.filter((p) => p.type === 'month').map((p) => p.value).join(''));
      const yearSpan = createElement('span', 'ec-month-scroller-month-year',
        parts.filter((p) => p.type === 'year').map((p) => p.value).join(''));
      banner.append(monthSpan, createElement('span', '', ' '), yearSpan);
      r.rowEl.insertBefore(banner, r.rowEl.firstChild);
      r.monthAnchor = cloneDate(d);
    } else if (!needs && existing) {
      existing.remove();
      r.monthAnchor = null;
    }
    prevKey = key;
  }
}

function enumerateWeekDays(weekStart) {
  const out = [];
  const d = cloneDate(weekStart);
  for (let i = 0; i < 7; ++i) {
    out.push(cloneDate(d));
    addDay(d);
  }
  return out;
}

// Stamp every event chip for every visible week row. Wipes previous
// chips first. Runs on initial mount and on filteredEvents change.
// `emitDateChange` is the scroller's own helper that updates
// options.date WITHOUT triggering the rangeSub re-scroll loop — when
// a chip is single-clicked we set options.date to the event's start
// so a subsequent view-switch lands on the event's week.
function renderEvents(weekRows, state, emitDateChange) {
  const options = state.get('options');
  const theme = options.theme;
  const events = state.get('filteredEvents') ?? [];
  const fire = state.get('fire');
  for (const r of weekRows) {
    const cells = r.rowEl.querySelector('.ec-month-scroller-cells');
    if (!cells) continue;
    // Clear previous event lists inside each cell — keep day-number.
    for (const cell of cells.children) {
      const num = cell.querySelector('.ec-day-number');
      cell.replaceChildren(num);
    }
    // Stamp events per cell.
    for (const cell of cells.children) {
      const date = createDate(cell.getAttribute('data-date'));
      const next = cloneDate(date);
      addDay(next);
      const dayEvents = events.filter((e) => e.start < next && e.end > date);
      if (!dayEvents.length) continue;
      const list = createElement('div', theme.events ?? 'ec-events');
      const max = typeof options.dayMaxEvents === 'number' ? options.dayMaxEvents : 3;
      const visible = dayEvents.slice(0, max);
      const hidden = dayEvents.slice(max);
      for (const event of visible) {
        const chip = createElement('div', theme.event ?? 'ec-event', '', [
          ['data-event-id', event.id],
        ]);
        if (event.backgroundColor) chip.style.backgroundColor = event.backgroundColor;
        chip.append(createElement('span', 'ec-event-dot'));
        if (!event.allDay) {
          const t = new Intl.DateTimeFormat(options.locale, {
            timeZone: 'UTC', ...options.eventTimeFormat,
          }).format(event.start);
          chip.append(createElement('time', theme.eventTime ?? 'ec-event-time', t + ' '));
        }
        chip.append(createElement('span', theme.eventTitle ?? 'ec-event-title', event.title || ''));
        // Re-apply selection across re-renders: the selected event id is
        // stashed on state so a renderEvents call triggered by
        // emitDateChange (or any other state change) repaints the chip
        // with .ec-event-selected.
        if (state.get('selectedEventId') === event.id) chip.classList.add('ec-event-selected');
        chip.addEventListener('click', (jsEvent) => {
          document.querySelectorAll('.ec-event.ec-event-selected')
            .forEach((c) => c.classList.remove('ec-event-selected'));
          chip.classList.add('ec-event-selected');
          state.set('selectedEventId', event.id);
          // Sync options.date to the event's start (silenced so the
          // month scroll doesn't jump). Switching to Week now lands on
          // the week that contains this event.
          emitDateChange?.(cloneDate(event.start));
          fire?.('eventClick', { event, jsEvent, view: state.get('view') });
          jsEvent.stopPropagation();
        });
        chip.addEventListener('dblclick',  (jsEvent) => fire?.('eventDoubleClick',{ event, jsEvent, view: state.get('view'), el: chip }));
        chip.addEventListener('mouseenter',(jsEvent) => fire?.('eventMouseEnter', { event, jsEvent, view: state.get('view') }));
        chip.addEventListener('mouseleave',(jsEvent) => fire?.('eventMouseLeave', { event, jsEvent, view: state.get('view') }));
        list.append(chip);
      }
      if (hidden.length) {
        const more = createElement('button', 'ec-more-link', `+${hidden.length} more`, [
          ['type', 'button'],
          ['data-more-link', 'true'],
          ['data-date', toISODate(date)],
        ]);
        list.append(more);
      }
      cell.append(list);
    }
  }
}

function startOfMonth(d) {
  d.setUTCDate(1);
  setMidnight(d);
  return d;
}

function toISODate(date) {
  return date.toISOString().substring(0, 10);
}
