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
const INITIAL_MONTHS_EACH_SIDE = 6;

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

  // Initial range — extend INITIAL_MONTHS_EACH_SIDE months on each side
  // of the anchor month.
  const anchor = startOfMonth(cloneDate(state.get('options').date));
  const initStart = startOfMonth(cloneDate(anchor));
  initStart.setUTCMonth(initStart.getUTCMonth() - INITIAL_MONTHS_EACH_SIDE);
  const initEnd = startOfMonth(cloneDate(anchor));
  initEnd.setUTCMonth(initEnd.getUTCMonth() + INITIAL_MONTHS_EACH_SIDE + 1);
  buildWeeks(body, initStart, initEnd, weekRows, state);

  // Centre the anchor month in the viewport on mount. We disable smooth
  // scroll for the seed so scrollTop lands instantly (otherwise the
  // settled-scroll handler fires repeatedly during the smooth animation
  // and snaps options.date to whatever the in-flight position happens to
  // be), then re-enable so post-mount user scrolls feel smooth.
  requestAnimationFrame(() => {
    const target = weekRows.find((r) => r.monthAnchor && datesEqual(r.monthAnchor, anchor));
    if (target) {
      const desired = target.rowEl.offsetTop - 12;
      const prevBehavior = body.style.scrollBehavior;
      body.style.scrollBehavior = 'auto';
      body.scrollTop = Math.max(0, desired);
      // Force a layout flush so the scroll position is committed before
      // we restore smooth.
      void body.offsetTop;
      body.style.scrollBehavior = prevBehavior || '';
    }
    body.addEventListener('scroll', onScroll, { passive: true });
  });

  // Re-render events when state changes.
  let renderTimer = null;
  const off = state.onAny(({ key }) => {
    if (['filteredEvents', 'currentRange', 'activeRange', 'options'].includes(key)) {
      // Coalesce bursts.
      if (renderTimer) return;
      renderTimer = setTimeout(() => {
        renderTimer = null;
        renderEvents(weekRows, state);
      }, 0);
    }
  });
  renderEvents(weekRows, state);

  // --------- scroll handling ---------

  let settleTimer = null;
  let suppressOnDateChange = false;

  function onScroll() {
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

  function onScrollSettled() {
    if (suppressOnDateChange) return;
    const centreY = body.scrollTop + body.clientHeight / 2;
    // Find the week row whose midpoint is closest to centreY, then snap
    // to the first-of-month within that row's week (or the row's first
    // visible day).
    let best = null;
    let bestDist = Infinity;
    for (const r of weekRows) {
      const mid = r.rowEl.offsetTop + r.rowEl.offsetHeight / 2;
      const d = Math.abs(mid - centreY);
      if (d < bestDist) { bestDist = d; best = r; }
    }
    if (!best) return;
    // The "current" month is the month that contains most of this row.
    const days = enumerateWeekDays(best.weekStart);
    const cnt = {};
    for (const d of days) {
      const k = `${d.getUTCFullYear()}-${d.getUTCMonth()}`;
      cnt[k] = (cnt[k] ?? 0) + 1;
    }
    let bestMonthKey = null, bestMonthCnt = 0;
    for (const [k, v] of Object.entries(cnt)) {
      if (v > bestMonthCnt) { bestMonthKey = k; bestMonthCnt = v; }
    }
    const [y, m] = bestMonthKey.split('-').map(Number);
    const newDate = new Date(Date.UTC(y, m, 1));
    const currentOption = state.get('options').date;
    if (!datesEqual(startOfMonth(cloneDate(currentOption)), newDate)) {
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
    renderEvents(weekRows, state);
  }

  function extendBackward() {
    const first = weekRows[0];
    if (!first) return;
    const newEnd = cloneDate(first.weekStart);
    const newStart = cloneDate(newEnd);
    newStart.setUTCMonth(newStart.getUTCMonth() - MONTHS_PER_EXTEND);
    // Snap to the first weekday of the user's firstDay setting.
    const fd = state.get('options').firstDay ?? 0;
    prevClosestDay(newStart, fd);
    // Capture the scroll-from-top so we can preserve scrollTop after the
    // DOM grows upwards.
    const oldHeight = body.scrollHeight;
    buildWeeks(body, newStart, newEnd, weekRows, state, { prepend: true });
    renderEvents(weekRows, state);
    const newHeight = body.scrollHeight;
    suppressOnDateChange = true;
    body.scrollTop += newHeight - oldHeight;
    // Allow date-change updates again after the layout adjustment.
    requestAnimationFrame(() => { suppressOnDateChange = false; });
  }

  // --------- public surface ---------

  return {
    destroy() {
      off();
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
      const monthAnchor = days.find((d) => d.getUTCDate() === 1) ?? null;
      const rowEl = createElement('div', 'ec-month-scroller-row', '', [
        ['data-week-start', toISODate(weekStart)],
      ]);
      if (monthAnchor) {
        const banner = createElement('div', 'ec-month-scroller-month-banner', '');
        const mfmt = new Intl.DateTimeFormat(options.locale, {
          timeZone: 'UTC', month: 'long', year: 'numeric',
        });
        const parts = mfmt.formatToParts(monthAnchor);
        // Render "October 2026" with a soft tone on the year part.
        const monthSpan = createElement('span', 'ec-month-scroller-month-name',
          parts.filter((p) => p.type === 'month').map((p) => p.value).join(''));
        const yearSpan = createElement('span', 'ec-month-scroller-month-year',
          parts.filter((p) => p.type === 'year').map((p) => p.value).join(''));
        banner.append(monthSpan, createElement('span', '', ' '), yearSpan);
        rowEl.append(banner);
      }
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
      newRows.push({ rowEl, weekStart: cloneDate(weekStart), monthAnchor });
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
function renderEvents(weekRows, state) {
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
        chip.addEventListener('click',     (jsEvent) => fire?.('eventClick',      { event, jsEvent, view: state.get('view') }));
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
