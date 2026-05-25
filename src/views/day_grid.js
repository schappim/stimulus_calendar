// DayGrid month/week/day renderer. Builds a weeks × days CSS grid where
// each cell is one day. Phase 5 ships the skeleton; subsequent commits in
// the phase layer in cell content, event rendering, +N more, popovers,
// and week numbers.

import { createElement } from '../lib/dom.js';
import { cloneDate, addDay, prevClosestDay, setMidnight, datesEqual } from '../lib/date.js';
import { viewDates as viewDatesHelper } from '../lib/derived.js';

// Mount the day-grid view into `container`. Returns a teardown thunk.
export function renderDayGridView(container, state) {
  const render = () => {
    const options = state.get('options');
    const theme = options.theme;
    const activeRange = expandedActiveRange(state);

    const days = viewDatesHelper(activeRange, options.hiddenDays ?? []);
    const visibleWeekdays = 7 - (options.hiddenDays?.length ?? 0);

    const grid = createElement('div', `${theme.grid} ec-day-grid`, '', [
      ['data-grid', 'day-grid'],
    ]);
    grid.style.setProperty('--ec-cols', String(visibleWeekdays));

    // Day-of-week headers row.
    const headers = createElement('div', theme.colHead, '', [
      ['data-row', 'header'],
    ]);
    const headerFmt = new Intl.DateTimeFormat(options.locale, options.dayHeaderFormat);
    for (const d of days.slice(0, visibleWeekdays)) {
      const head = createElement('div', theme.dayHead, headerFmt.format(d), [
        ['data-day', String(d.getUTCDay())],
      ]);
      headers.append(head);
    }
    grid.append(headers);

    // Day cells, chunked into rows.
    let row = createElement('div', '', '', [['data-row', 'days']]);
    const today = midnightToday();
    const currentRange = state.get('currentRange');
    for (let i = 0; i < days.length; ++i) {
      if (i > 0 && i % visibleWeekdays === 0) {
        grid.append(row);
        row = createElement('div', '', '', [['data-row', 'days']]);
      }
      const d = days[i];
      const cls = [theme.day];
      const inCurrent = !currentRange || (d >= currentRange.start && d < currentRange.end);
      if (!inCurrent) cls.push(theme.otherMonth);
      if (datesEqual(d, today)) cls.push(theme.today);
      const cell = createElement('div', cls.filter(Boolean).join(' '), '', [
        ['data-date', d.toISOString().substring(0, 10)],
      ]);
      row.append(cell);
    }
    grid.append(row);

    container.replaceChildren(grid);
  };

  render();
  const off = state.onAny(({ key }) => {
    if (['options', 'currentRange', 'activeRange', 'viewDates'].includes(key)) {
      render();
    }
  });

  return () => {
    off();
    container.replaceChildren();
  };
}

// For dayGridMonth, the active range needs to pad to the previous firstDay
// and the day after the next firstDay so the grid is full weeks. dayGridWeek
// + dayGridDay don't need padding. Used by both the renderer and the
// effective viewDates helper.
function expandedActiveRange(state) {
  const ar = state.get('activeRange');
  if (!ar) return null;
  const options = state.get('options');
  if (options.view !== 'dayGridMonth') return ar;
  const firstDay = options.firstDay ?? 0;
  const start = prevClosestDay(setMidnight(cloneDate(ar.start)), firstDay);
  const end = cloneDate(ar.end);
  setMidnight(end);
  // Bump end forward to the next firstDay so the last row is full.
  while (end.getUTCDay() !== firstDay) addDay(end);
  return { start, end };
}

function midnightToday() {
  return setMidnight(new Date());
}
