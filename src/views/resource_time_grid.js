// ResourceTimeGrid view — per-resource column slot grid. Headers show the
// resource title (or per-day + nested resource cols when datesAboveResources
// is true). Each event with a matching resourceId lands in that resource's
// column; events without a resourceId land in every column (fan-out).

import { createElement } from '../lib/dom.js';
import { cloneDate, addDay, setMidnight, datesEqual } from '../lib/date.js';
import { createSlots, createSlotTimeLimits } from '../lib/slots.js';
import { viewDates as viewDatesHelper } from '../lib/derived.js';
import { assignOverlapLanes } from '../lib/events.js';
import { eventMetaDataAttrs, resolveEventType } from '../lib/event_meta.js';
import { formatEventTimeRange } from './time_grid.js';

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
    // Drive every child grid (header, body's .ec-days) off the SAME column
    // count — (days × resources) — so the resource-header cells line up
    // with their day columns below. The header's CSS grid-template-columns
    // falls back to 7 when --ec-cols is unset; without this, a 1-day × 5-
    // resource board renders the header as 7 equal slots filled with 5
    // cells, while the body renders 5 equal day columns — misaligned.
    root.style.setProperty('--ec-cols', String(days.length * visibleResources.length));

    // Header: resource columns per day (or days then resources if
    // datesAboveResources is true).
    const header = createElement('div', theme.colHead, '', [['data-row', 'header']]);
    header.append(createElement('div', `${theme.sidebar} ec-corner`));
    const headerFmt = new Intl.DateTimeFormat(options.locale, { timeZone: 'UTC', ...options.dayHeaderFormat });
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
      format: (d) => new Intl.DateTimeFormat(options.locale, { timeZone: 'UTC', ...options.slotLabelFormat }).format(d),
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
        // Stagger overlapping events into staircase lanes so the chip
        // behind keeps a clickable left strip when a later event paints
        // on top. Background bands (display:'background') are excluded
        // from lane assignment so a real chip that overlaps a band still
        // lands at lane 0.
        const laneEvents = dayEvents.filter((e) => e.display !== 'background');
        const laneMap = assignOverlapLanes(laneEvents);
        const LANE_OFFSET_PX = 16;
        const minutesPerSlot = totalSeconds(options.slotDuration) / 60;
        const slotMinMin = totalSeconds(slotTimeLimits.min) / 60;
        const pxPerMin = options.slotHeight / minutesPerSlot;
        for (const event of dayEvents) {
          const startMin = minsSinceMidnight(event.start) - slotMinMin;
          const endMin = minsSinceMidnight(event.end) - slotMinMin;

          // Background bands: full-width, z-index 0, no content.
          // eventClassNames still runs so the host app can style each band.
          if (event.display === 'background') {
            const bgClasses = ['ec-bg-event'];
            const globalCls = options.eventClassNames;
            if (typeof globalCls === 'function') {
              const c = globalCls({ event });
              if (c) bgClasses.push(...(Array.isArray(c) ? c : [c]));
            } else if (globalCls) {
              bgClasses.push(...(Array.isArray(globalCls) ? globalCls : [globalCls]));
            }
            if (event.classNames) bgClasses.push(...(Array.isArray(event.classNames) ? event.classNames : [event.classNames]));
            const bg = createElement('div', bgClasses.filter(Boolean).join(' '), '', [
              ['data-event-id', event.id],
              ...eventMetaDataAttrs(event),
            ]);
            bg.style.position = 'absolute';
            bg.style.top = `${startMin * pxPerMin}px`;
            bg.style.height = `${Math.max((endMin - startMin) * pxPerMin, 12)}px`;
            bg.style.left = '0';
            bg.style.right = '0';
            bg.style.zIndex = '0';
            if (event.backgroundColor) bg.style.background = event.backgroundColor;
            // eventContent runs for bg events here too — see time_grid.js
            // for the rationale.
            const contentFn = options.eventContent;
            if (typeof contentFn === 'function') {
              const c = contentFn({ event });
              if (typeof c === 'string') bg.textContent = c;
              else if (c?.html) bg.innerHTML = c.html;
              else if (c?.domNodes) c.domNodes.forEach((n) => bg.append(n));
            }
            overlay.append(bg);
            continue;
          }

          const chipClasses = [theme.event];
          const globalCls2 = options.eventClassNames;
          if (typeof globalCls2 === 'function') {
            const c = globalCls2({ event });
            if (c) chipClasses.push(...(Array.isArray(c) ? c : [c]));
          } else if (globalCls2) {
            chipClasses.push(...(Array.isArray(globalCls2) ? globalCls2 : [globalCls2]));
          }
          if (event.classNames) chipClasses.push(...(Array.isArray(event.classNames) ? event.classNames : [event.classNames]));
          // S5 — eventTypes mapping.
          const typeStyle = resolveEventType(event, options);
          if (typeStyle) chipClasses.push(...typeStyle.classNames);
          const chip = createElement('div', chipClasses.filter(Boolean).join(' '), '', [
            ['data-event-id', event.id],
            ...eventMetaDataAttrs(event),
          ]);
          const lane = laneMap.get(event) ?? 0;
          chip.style.position = 'absolute';
          chip.style.top = `${startMin * pxPerMin}px`;
          const chipHeightPx = Math.max((endMin - startMin) * pxPerMin, 12);
          chip.style.height = `${chipHeightPx}px`;
          if (chipHeightPx < 36) chip.classList.add('ec-event-compact');
          chip.style.left = lane === 0 ? '0' : `${lane * LANE_OFFSET_PX}px`;
          chip.style.right = '0';
          if (lane > 0) chip.style.zIndex = String(lane + 1);
          const eventColor = event.backgroundColor ?? typeStyle?.color ?? resource.eventBackgroundColor;
          if (eventColor) chip.style.setProperty('--ec-event-color', eventColor);
          chip.append(createElement('div', theme.eventTitle, event.title || ''));
          const timeEl = createElement('div', theme.eventTime ?? 'ec-event-time');
          // Presentation attributes (width/height/fill/stroke) keep the
          // icon rendering correctly when the chip is cloned into the drag
          // ghost and re-parented to <body>, breaking the descendant
          // cascade — see time_grid.js CLOCK_ICON_SVG for context.
          timeEl.innerHTML = `<svg class="ec-clock-icon" viewBox="0 0 12 12" width="11" height="11" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><circle cx="6" cy="6" r="4.5"/><path d="M6 3.5 V6 L7.7 7" stroke-linecap="round"/></svg>`;
          timeEl.append(document.createTextNode(formatEventTimeRange(event.start, event.end, options)));
          chip.append(timeEl);
          const fire = state.get('fire');
          chip.addEventListener('click',     (jsEvent) => fire?.('eventClick',      { event, jsEvent, view: state.get('view'), resource }));
          chip.addEventListener('dblclick',  (jsEvent) => fire?.('eventDoubleClick',{ event, jsEvent, view: state.get('view'), resource, el: chip }));
          chip.addEventListener('mouseenter',(jsEvent) => fire?.('eventMouseEnter', { event, jsEvent, view: state.get('view'), resource }));
          chip.addEventListener('mouseleave',(jsEvent) => fire?.('eventMouseLeave', { event, jsEvent, view: state.get('view'), resource }));
          queueMicrotask(() => fire?.('eventDidMount', { event, el: chip, view: state.get('view'), resource }));
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
