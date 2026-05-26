// List view renderer — chronological list of events grouped by day. Each
// day with one or more events gets a header row + an event row per event.
// Empty result shows noEventsContent.

import { createElement } from '../lib/dom.js';
import { cloneDate, addDay, setMidnight } from '../lib/date.js';
import { viewDates as viewDatesHelper } from '../lib/derived.js';

export function renderListView(container, state) {
  const render = () => {
    const options = state.get('options');
    const theme = options.theme;
    const activeRange = state.get('activeRange');
    if (!activeRange) return;

    const days = viewDatesHelper(activeRange, options.hiddenDays ?? []);
    const events = state.get('filteredEvents') ?? [];

    const root = createElement('div', `${theme.grid} ec-list`, '', [
      ['data-grid', 'list'],
    ]);

    const dayFmt = new Intl.DateTimeFormat(options.locale, { timeZone: 'UTC', ...options.listDayFormat });
    const sideFmt = new Intl.DateTimeFormat(options.locale, { timeZone: 'UTC', ...options.listDaySideFormat });
    const timeFmt = new Intl.DateTimeFormat(options.locale, { timeZone: 'UTC', ...options.eventTimeFormat });

    let totalEvents = 0;
    for (const day of days) {
      const next = cloneDate(day); addDay(next);
      const dayEvents = events.filter((e) => e.start < next && e.end > day);
      if (!dayEvents.length) continue;
      totalEvents += dayEvents.length;

      const header = createElement('div', theme.dayHead, '', [
        ['data-row', 'day-header'],
        ['data-date', day.toISOString().substring(0, 10)],
      ]);
      header.append(createElement('span', '', dayFmt.format(day)));
      header.append(createElement('span', theme.daySide, sideFmt.format(day)));
      root.append(header);

      for (const event of dayEvents) {
        const rowClasses = [theme.event];
        const globalCls = options.eventClassNames;
        if (typeof globalCls === 'function') {
          const c = globalCls({ event });
          if (c) rowClasses.push(...(Array.isArray(c) ? c : [c]));
        } else if (globalCls) {
          rowClasses.push(...(Array.isArray(globalCls) ? globalCls : [globalCls]));
        }
        if (event.classNames) rowClasses.push(...(Array.isArray(event.classNames) ? event.classNames : [event.classNames]));
        const row = createElement('div', rowClasses.filter(Boolean).join(' '), '', [
          ['data-event-id', event.id],
        ]);
        // Route the per-event colour through --ec-event-color on the row so
        // both the row stripe and the tag dot inherit the accent. Per-type
        // modifier classes (.ec-appt-*) can still override via specificity.
        if (event.backgroundColor) row.style.setProperty('--ec-event-color', event.backgroundColor);
        row.append(createElement('span', theme.eventTag));
        const time = event.allDay ? 'all-day' : timeFmt.format(event.start);
        row.append(createElement('time', theme.eventTime, time));
        row.append(createElement('span', theme.eventTitle, event.title || ''));
        const fire = state.get('fire');
        if (state.get('selectedEventId') === event.id) row.classList.add('ec-event-selected');
        row.addEventListener('click', (jsEvent) => {
          document.querySelectorAll('.ec-event.ec-event-selected')
            .forEach((c) => c.classList.remove('ec-event-selected'));
          row.classList.add('ec-event-selected');
          state.set('selectedEventId', event.id);
          fire?.('eventClick', { event, jsEvent, view: state.get('view') });
        });
        row.addEventListener('dblclick',  (jsEvent) => fire?.('eventDoubleClick',{ event, jsEvent, view: state.get('view'), el: row }));
        row.addEventListener('mouseenter',(jsEvent) => fire?.('eventMouseEnter', { event, jsEvent, view: state.get('view') }));
        row.addEventListener('mouseleave',(jsEvent) => fire?.('eventMouseLeave', { event, jsEvent, view: state.get('view') }));
        queueMicrotask(() => fire?.('eventDidMount', { event, el: row, view: state.get('view') }));
        root.append(row);
      }
    }

    if (totalEvents === 0) {
      const empty = createElement('div', theme.noEvents);
      const content = options.noEventsContent;
      if (typeof content === 'function') {
        const c = content();
        if (typeof c === 'string') empty.textContent = c;
        else if (c?.html) empty.innerHTML = c.html;
      } else if (typeof content === 'string') {
        empty.textContent = content;
      } else if (content?.html) {
        empty.innerHTML = content.html;
      }
      if (typeof options.noEventsClick === 'function') {
        empty.style.cursor = 'pointer';
        empty.addEventListener('click', (jsEvent) => options.noEventsClick({ jsEvent }));
      }
      root.append(empty);
    }

    container.replaceChildren(root);
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
