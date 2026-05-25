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

    const dayFmt = new Intl.DateTimeFormat(options.locale, options.listDayFormat);
    const sideFmt = new Intl.DateTimeFormat(options.locale, options.listDaySideFormat);
    const timeFmt = new Intl.DateTimeFormat(options.locale, options.eventTimeFormat);

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
        const row = createElement('div', theme.event, '', [
          ['data-event-id', event.id],
        ]);
        if (event.backgroundColor) {
          row.append(createElement('span', theme.eventTag).tap = ((el) => {
            el.style.background = event.backgroundColor;
            return el;
          })(createElement('span', theme.eventTag)));
        } else {
          row.append(createElement('span', theme.eventTag));
        }
        const time = event.allDay ? 'all-day' : timeFmt.format(event.start);
        row.append(createElement('time', theme.eventTime, time));
        row.append(createElement('span', theme.eventTitle, event.title || ''));
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
