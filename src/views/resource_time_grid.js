// ResourceTimeGrid view — per-resource column slot grid. Headers show the
// resource title (or per-day + nested resource cols when datesAboveResources
// is true). Each event with a matching resourceId lands in that resource's
// column; events without a resourceId land in every column (fan-out).

import { createElement } from '../lib/dom.js';
import { cloneDate, addDay, setMidnight, datesEqual } from '../lib/date.js';
import { createSlots, createSlotTimeLimits } from '../lib/slots.js';
import { viewDates as viewDatesHelper } from '../lib/derived.js';

export function renderResourceTimeGridView(container, state) {
  const render = () => {
    const options = state.get('options');
    const theme = options.theme;
    const activeRange = state.get('activeRange');
    const resources = state.get('resources') ?? options.resources ?? [];
    if (!activeRange || !resources.length) {
      container.replaceChildren(createElement('div', theme.noEvents,
        'No resources configured'));
      return;
    }

    const days = viewDatesHelper(activeRange, options.hiddenDays ?? []);
    const filtered = state.get('filteredEvents') ?? [];

    // Optional filter: hide resources with zero events in range.
    let visibleResources = resources;
    if (options.filterResourcesWithEvents) {
      visibleResources = resources.filter((r) =>
        filtered.some((e) => e.resourceIds.includes(r.id)));
    }

    const root = createElement('div', `${theme.grid} ec-resource ec-time-grid`, '', [
      ['data-grid', 'resource-time-grid'],
    ]);

    // Header: resource columns per day (or days then resources if
    // datesAboveResources is true).
    const header = createElement('div', theme.colHead, '', [['data-row', 'header']]);
    header.append(createElement('div', `${theme.sidebar} ec-corner`));
    const headerFmt = new Intl.DateTimeFormat(options.locale, options.dayHeaderFormat);
    for (const day of days) {
      for (const resource of visibleResources) {
        const head = createElement('div', theme.dayHead, '', [
          ['data-day', String(day.getUTCDay())],
          ['data-resource-id', resource.id],
        ]);
        const dayLabel = createElement('div', '', headerFmt.format(day));
        const resourceLabel = createElement('div', theme.resourceLabel, '', [
          ['data-resource-label', ''],
        ]);
        const labelContent = options.resourceLabelContent;
        let title = resource.title;
        if (typeof labelContent === 'function') {
          const c = labelContent({ resource });
          if (typeof c === 'string') title = c;
          else if (c?.html) { resourceLabel.innerHTML = c.html; title = null; }
        }
        if (title !== null) resourceLabel.textContent = title;
        if (typeof options.resourceLabelDidMount === 'function') {
          queueMicrotask(() => options.resourceLabelDidMount({ resource, el: resourceLabel }));
        }
        if (options.datesAboveResources) head.append(dayLabel, resourceLabel);
        else head.append(resourceLabel, dayLabel);
        header.append(head);
      }
    }
    root.append(header);

    // Body — minimal: sidebar + concatenated day/resource columns.
    const body = createElement('div', 'ec-time-body', '', [['data-row', 'body']]);
    const slotTimeLimits = createSlotTimeLimits(
      options.slotMinTime, options.slotMaxTime,
      options.flexibleSlotTimeLimits, days, filtered,
    );
    const slotLabelFmt = {
      format: (d) => new Intl.DateTimeFormat(options.locale, options.slotLabelFormat).format(d),
    };
    const slots = createSlots(
      activeRange.start, options.slotDuration, 1, slotTimeLimits, slotLabelFmt,
    );

    const sidebar = createElement('div', theme.sidebar);
    for (const [_iso, label] of slots) {
      const cell = createElement('div', theme.slot, label);
      cell.style.height = `${options.slotHeight}px`;
      sidebar.append(cell);
    }
    body.append(sidebar);

    const colsWrap = createElement('div', `${theme.grid} ec-days`);
    colsWrap.style.setProperty('--ec-cols', String(days.length * visibleResources.length));
    for (const day of days) {
      for (const resource of visibleResources) {
        const col = createElement('div', `${theme.day} ec-time-col`, '', [
          ['data-date', day.toISOString().substring(0, 10)],
          ['data-resource-id', resource.id],
        ]);
        for (let i = 0; i < slots.length; ++i) {
          const slotEl = createElement('div', theme.slot);
          slotEl.style.height = `${options.slotHeight}px`;
          col.append(slotEl);
        }
        const overlay = createElement('div', 'ec-event-overlay');
        const nextDay = cloneDate(day); addDay(nextDay);
        const dayEvents = filtered.filter((e) =>
          !e.allDay &&
          e.start < nextDay && e.end > day &&
          (e.resourceIds.length === 0 || e.resourceIds.includes(resource.id))
        );
        for (const event of dayEvents) {
          const chip = createElement('div', theme.event, '', [
            ['data-event-id', event.id],
          ]);
          const minutesPerSlot = totalSeconds(options.slotDuration) / 60;
          const slotMinMin = totalSeconds(slotTimeLimits.min) / 60;
          const startMin = minsSinceMidnight(event.start) - slotMinMin;
          const endMin = minsSinceMidnight(event.end) - slotMinMin;
          const pxPerMin = options.slotHeight / minutesPerSlot;
          chip.style.position = 'absolute';
          chip.style.top = `${startMin * pxPerMin}px`;
          chip.style.height = `${Math.max((endMin - startMin) * pxPerMin, 12)}px`;
          chip.style.left = '0';
          chip.style.right = '0';
          if (event.backgroundColor || resource.eventBackgroundColor) {
            chip.style.backgroundColor = event.backgroundColor ?? resource.eventBackgroundColor;
          }
          chip.append(createElement('div', theme.eventTitle, event.title || ''));
          overlay.append(chip);
        }
        col.style.position = 'relative';
        col.append(overlay);
        colsWrap.append(col);
      }
    }
    body.append(colsWrap);
    root.append(body);
    container.replaceChildren(root);
  };

  render();
  const off = state.onAny(({ key }) => {
    if (['options', 'currentRange', 'activeRange', 'viewDates',
         'filteredEvents', 'resources'].includes(key)) render();
  });

  return () => { off(); container.replaceChildren(); };
}

function minsSinceMidnight(date) {
  return date.getUTCHours() * 60 + date.getUTCMinutes();
}
function totalSeconds(duration) {
  return duration.days * 86400 + duration.seconds;
}
