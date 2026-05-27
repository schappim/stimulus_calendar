// DayGrid month/week/day renderer. Builds a weeks × days CSS grid where
// each cell is one day. Phase 5 ships the skeleton; subsequent commits in
// the phase layer in cell content, event rendering, +N more, popovers,
// and week numbers.

import { createElement } from '../lib/dom.js';
import {
  cloneDate, addDay, prevClosestDay, setMidnight, datesEqual,
  getWeekNumber, createWeekNumberContent,
} from '../lib/date.js';
import { viewDates as viewDatesHelper } from '../lib/derived.js';
import {
  eventMetaClassNames,
  eventMetaDataAttrs,
  buildRecurringBadge,
} from '../lib/event_meta.js';

function eventsOnDay(events, day) {
  const next = cloneDate(day);
  addDay(next);
  return events.filter((e) => e.start < next && e.end > day);
}

function eventTimeText(event, options) {
  if (event.allDay) return '';
  const fmt = new Intl.DateTimeFormat(options.locale, { timeZone: 'UTC', ...options.eventTimeFormat });
  return fmt.format(event.start);
}

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

    // Day-of-week headers row. Optional leading week-number column.
    const headers = createElement('div', theme.colHead, '', [
      ['data-row', 'header'],
    ]);
    if (options.weekNumbers) {
      headers.append(createElement('div', theme.weekNumber, ''));
    }
    const headerFmt = new Intl.DateTimeFormat(options.locale, { timeZone: 'UTC', ...options.dayHeaderFormat });
    // Phase C2 — density dots. When enabled, the renderer counts events
    // per day (capped at 3) and either renders a built-in trio of dots
    // or hands { date, count, max } to a custom recipe.
    const dotsOpt = options.dayHeaderDensity;
    const filteredForDots = dotsOpt ? (state.get('filteredEvents') ?? []) : [];
    const countOn = (day) => {
      const next = cloneDate(day); addDay(next);
      return filteredForDots.filter((e) => e.start < next && e.end > day).length;
    };
    for (const d of days.slice(0, visibleWeekdays)) {
      const head = createElement('div', theme.dayHead, headerFmt.format(d), [
        ['data-day', String(d.getUTCDay())],
      ]);
      if (dotsOpt) {
        const count = countOn(d);
        if (count > 0) {
          if (typeof dotsOpt === 'function') {
            const c = dotsOpt({ date: d, count, max: 3 });
            const wrap = createElement('span', 'ec-day-head-density');
            if (typeof c === 'string') wrap.textContent = c;
            else if (c?.html) wrap.innerHTML = c.html;
            else if (c?.domNodes) c.domNodes.forEach((n) => wrap.append(n));
            head.append(wrap);
          } else {
            const dots = createElement('span', 'ec-day-head-density');
            for (let i = 0; i < Math.min(3, count); ++i) {
              dots.append(createElement('span', 'ec-day-head-dot'));
            }
            head.append(dots);
          }
        }
      }
      headers.append(head);
    }
    grid.append(headers);
    grid.style.setProperty('--ec-cols-with-week',
      String(visibleWeekdays + (options.weekNumbers ? 1 : 0)));

    // Day cells, chunked into rows.
    let row = createElement('div', '', '', [['data-row', 'days']]);
    const today = midnightToday();
    const currentRange = state.get('currentRange');
    const dayFmt = new Intl.DateTimeFormat(options.locale, { timeZone: 'UTC', ...(options.dayCellFormat ?? { day: 'numeric' }) });
    for (let i = 0; i < days.length; ++i) {
      if (i > 0 && i % visibleWeekdays === 0) {
        grid.append(row);
        row = createElement('div', '', '', [['data-row', 'days']]);
      }
      const d = days[i];
      // Week-number column at the start of each row.
      if (options.weekNumbers && i % visibleWeekdays === 0) {
        const week = getWeekNumber(d, options.firstDay ?? 0);
        const content = createWeekNumberContent(week, options.weekNumberContent, d);
        const weekEl = createElement('div', theme.weekNumber, '', [
          ['data-week', String(week)],
        ]);
        if (typeof content === 'string') weekEl.textContent = content;
        else if (content?.html) weekEl.innerHTML = content.html;
        else if (content?.domNodes) weekEl.replaceChildren(...content.domNodes);
        row.append(weekEl);
      }
      const cls = [theme.day];
      const inCurrent = !currentRange || (d >= currentRange.start && d < currentRange.end);
      if (!inCurrent) cls.push(theme.otherMonth);
      if (datesEqual(d, today)) cls.push(theme.today);
      const cell = createElement('div', cls.filter(Boolean).join(' '), '', [
        ['data-date', d.toISOString().substring(0, 10)],
      ]);
      const number = createElement('div', 'ec-day-number', dayFmt.format(d));
      cell.append(number);
      if (options.dayCellContent) {
        const content = typeof options.dayCellContent === 'function'
          ? options.dayCellContent({ date: d, view: state.get('view') })
          : options.dayCellContent;
        if (typeof content === 'string') {
          number.innerText = content;
        } else if (content?.html) {
          number.innerHTML = content.html;
        } else if (content?.domNodes) {
          number.replaceChildren(...content.domNodes);
        }
      }

      // Event chips inside the day cell.
      const events = state.get('filteredEvents') ?? [];
      const dayEvents = eventsOnDay(events, d);
      if (dayEvents.length) {
        const list = createElement('div', theme.events);
        const maxEvents = typeof options.dayMaxEvents === 'number'
          ? options.dayMaxEvents
          : Infinity;
        const visible = dayEvents.slice(0, maxEvents);
        const hidden = dayEvents.slice(maxEvents);
        for (const event of visible) {
          // Background events render as a translucent band (no chip).
          if (event.display === 'background') {
            const bg = createElement('div', theme.bgEvent, '', [
              ['data-event-id', event.id],
              ...eventMetaDataAttrs(event),
            ]);
            const bgColor = event.backgroundColor ?? options.eventBackgroundColor ?? options.eventColor;
            if (bgColor) bg.style.backgroundColor = bgColor;
            cell.append(bg);
            continue;
          }
          const classes = [theme.event];
          const globalCls = options.eventClassNames;
          if (typeof globalCls === 'function') {
            const c = globalCls({ event });
            if (c) classes.push(...(Array.isArray(c) ? c : [c]));
          } else if (globalCls) {
            classes.push(...(Array.isArray(globalCls) ? globalCls : [globalCls]));
          }
          classes.push(...event.classNames);
          // Phase C5/C6 — auto-classes from extendedProps.
          classes.push(...eventMetaClassNames(event));
          // Phase C3 — Month-cell event style. The `stripe` variant
          // renders a full-width coloured bar with title only — no dot,
          // no time. Matches the mockup's Month view.
          const stripe = options.dayCellEventStyle === 'stripe';
          if (stripe) classes.push('ec-event-stripe');
          const chip = createElement('div', classes.filter(Boolean).join(' '), '', [
            ['data-event-id', event.id],
            ...eventMetaDataAttrs(event),
          ]);
          const bgColor = event.backgroundColor ?? options.eventBackgroundColor ?? options.eventColor;
          const txtColor = event.textColor ?? options.eventTextColor;
          if (bgColor) chip.style.setProperty('--ec-event-color', bgColor);
          if (txtColor) chip.style.color = txtColor;
          if (options.eventContent) {
            const fn = options.eventContent;
            const content = typeof fn === 'function'
              ? fn({ event, timeText: eventTimeText(event, options), view: state.get('view') })
              : fn;
            if (typeof content === 'string') chip.innerText = content;
            else if (content?.html) chip.innerHTML = content.html;
            else if (content?.domNodes) chip.replaceChildren(...content.domNodes);
          } else if (stripe) {
            if (event.extendedProps?.rrule) chip.append(buildRecurringBadge());
            chip.append(createElement('span', theme.eventTitle, event.title || ''));
          } else {
            const dot = createElement('span', 'ec-event-dot');
            const time = eventTimeText(event, options);
            if (time && options.displayEventEnd !== false) {
              chip.append(dot, createElement('time', theme.eventTime, time + ' '));
            } else {
              chip.append(dot);
            }
            if (event.extendedProps?.rrule) chip.append(buildRecurringBadge());
            chip.append(createElement('span', theme.eventTitle, event.title || ''));
          }
          // User event handlers + matching DOM CustomEvent dispatch via
          // state.fire — listeners can hook either side.
          const fire = state.get('fire');
          if (state.get('selectedEventId') === event.id) chip.classList.add('ec-event-selected');
          chip.addEventListener('click', (jsEvent) => {
            document.querySelectorAll('.ec-event.ec-event-selected')
              .forEach((c) => c.classList.remove('ec-event-selected'));
            chip.classList.add('ec-event-selected');
            state.set('selectedEventId', event.id);
            fire?.('eventClick', { event, jsEvent, view: state.get('view') });
          });
          chip.addEventListener('dblclick',  (jsEvent) => fire?.('eventDoubleClick',{ event, jsEvent, view: state.get('view'), el: chip }));
          chip.addEventListener('mouseenter',(jsEvent) => fire?.('eventMouseEnter', { event, jsEvent, view: state.get('view') }));
          chip.addEventListener('mouseleave',(jsEvent) => fire?.('eventMouseLeave', { event, jsEvent, view: state.get('view') }));
          queueMicrotask(() => fire?.('eventDidMount', { event, el: chip, view: state.get('view') }));
          list.append(chip);
        }
        if (hidden.length) {
          const moreText = typeof options.moreLinkContent === 'function'
            ? options.moreLinkContent({ num: hidden.length, date: d })
            : (options.moreLinkContent ?? `+${hidden.length} more`);
          const link = createElement('button', 'ec-more-link',
            typeof moreText === 'object' && moreText?.html ? '' : moreText, [
              ['type', 'button'],
              ['data-more-link', 'true'],
              ['data-date', d.toISOString().substring(0, 10)],
            ]);
          if (typeof moreText === 'object' && moreText?.html) link.innerHTML = moreText.html;
          link.addEventListener('click', () => openDayPopover(state, d, dayEvents));
          list.append(link);
        }
        cell.append(list);
      }
      row.append(cell);
    }
    grid.append(row);

    container.replaceChildren(grid);
  };

  render();
  const off = state.onAny(({ key }) => {
    if (['options', 'currentRange', 'activeRange', 'viewDates', 'filteredEvents'].includes(key)) {
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

// Open a day popover listing every event for the day. Closes on outside
// click or on the close button. Phase 5 — minimal styling; CSS adds
// positioning + drop-shadow.
function openDayPopover(state, day, events) {
  const options = state.get('options');
  const theme = options.theme;
  const fmt = new Intl.DateTimeFormat(options.locale, { timeZone: 'UTC', ...options.dayPopoverFormat });
  const popup = createElement('div', `${theme.popup} ec-day-popover`, '', [
    ['data-popover', 'day'],
    ['data-date', day.toISOString().substring(0, 10)],
  ]);
  const header = createElement('div', 'ec-popup-header');
  header.append(createElement('div', 'ec-popup-title', fmt.format(day)));
  const closeText = options.buttonText?.close ?? 'Close';
  const closeBtn = createElement('button', 'ec-popup-close', closeText, [
    ['type', 'button'], ['aria-label', 'Close'],
  ]);
  header.append(closeBtn);
  popup.append(header);

  const list = createElement('div', theme.events);
  for (const event of events) {
    const chip = createElement('div', theme.event, '', [
      ['data-event-id', event.id],
      ...eventMetaDataAttrs(event),
    ]);
    if (event.backgroundColor) chip.style.setProperty('--ec-event-color', event.backgroundColor);
    chip.append(createElement('span', 'ec-event-dot'));
    const time = event.allDay
      ? ''
      : new Intl.DateTimeFormat(options.locale, { timeZone: 'UTC', ...options.eventTimeFormat }).format(event.start);
    if (time) chip.append(createElement('time', theme.eventTime, time + ' '));
    chip.append(createElement('span', theme.eventTitle, event.title || ''));
    list.append(chip);
  }
  popup.append(list);

  document.body.append(popup);
  const close = () => popup.remove();
  closeBtn.addEventListener('click', close);
  setTimeout(() => {
    document.addEventListener('click', function onOutside(e) {
      if (!popup.contains(e.target)) {
        close();
        document.removeEventListener('click', onOutside, true);
      }
    }, true);
  }, 0);
}
