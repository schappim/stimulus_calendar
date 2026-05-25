// ResourceTimeline view — time runs horizontally, resources stack
// vertically as rows. Phase 9 ships the skeleton: header timeline with
// day labels, one row per resource (with title + horizontal event ribbon),
// optional expand/collapse for nested resources.

import { createElement } from '../lib/dom.js';
import { cloneDate, addDay, setMidnight, datesEqual } from '../lib/date.js';
import { viewDates as viewDatesHelper } from '../lib/derived.js';
import { getPayload, setPayload } from '../lib/payload.js';

export function renderResourceTimelineView(container, state) {
  const render = () => {
    const options = state.get('options');
    const theme = options.theme;
    const activeRange = state.get('activeRange');
    const resources = state.get('resources') ?? options.resources ?? [];
    if (!activeRange) return;

    const days = viewDatesHelper(activeRange, options.hiddenDays ?? []);
    const events = state.get('filteredEvents') ?? [];
    const slotWidth = options.slotWidth ?? 32;

    const root = createElement('div', `${theme.grid} ec-timeline ec-resource`, '', [
      ['data-grid', 'resource-timeline'],
    ]);

    // Header — day labels across the timeline.
    const header = createElement('div', theme.colHead, '', [['data-row', 'header']]);
    header.append(createElement('div', `${theme.rowHead}`));
    const headerFmt = new Intl.DateTimeFormat(options.locale, { timeZone: 'UTC', ...options.dayHeaderFormat });
    const slotsHeader = createElement('div', theme.slots);
    for (const day of days) {
      const cell = createElement('div', theme.dayHead, headerFmt.format(day), [
        ['data-day', String(day.getUTCDay())],
      ]);
      cell.style.width = `${slotWidth}px`;
      slotsHeader.append(cell);
    }
    header.append(slotsHeader);
    root.append(header);

    // Rows — one per visible (non-hidden) resource. Recursive walk so
    // nested children are indented; collapsed parents hide descendants.
    const body = createElement('div', 'ec-timeline-body', '', [['data-row', 'body']]);
    const renderRow = (resource, depth) => {
      const payload = getPayload(resource);
      if (payload?.hidden) return;
      const row = createElement('div', 'ec-timeline-row', '', [
        ['data-resource-id', resource.id],
        ['data-depth', String(depth)],
      ]);
      const head = createElement('div', theme.rowHead, '', [['data-resource-label', '']]);
      head.style.paddingLeft = `${depth * 16}px`;

      // Expander button for nested resources.
      const hasChildren = payload?.children?.length > 0;
      if (hasChildren) {
        const expander = createElement('button', theme.expander, '', [
          ['type', 'button'],
          ['data-toolbar-action', 'expand'],
        ]);
        expander.innerHTML = resource.expanded
          ? (options.icons.collapse?.html ?? '−')
          : (options.icons.expand?.html ?? '+');
        expander.addEventListener('click', () => {
          resource.expanded = !resource.expanded;
          // Refresh hidden flags on descendants.
          const propagate = (r, hidden) => {
            const p = getPayload(r);
            if (!p) return;
            for (const c of p.children) {
              const cp = getPayload(c);
              if (cp) cp.hidden = hidden;
              propagate(c, hidden || !c.expanded);
            }
          };
          propagate(resource, !resource.expanded);
          render();
        });
        head.append(expander);
      }
      head.append(createElement('span', '', resource.title));
      row.append(head);

      const ribbon = createElement('div', 'ec-timeline-ribbon');
      ribbon.style.position = 'relative';
      ribbon.style.minHeight = '30px';
      const dayWidth = slotWidth;
      ribbon.style.width = `${days.length * dayWidth}px`;
      const resourceEvents = events.filter((e) =>
        e.resourceIds.length === 0 || e.resourceIds.includes(resource.id));
      for (const event of resourceEvents) {
        const startDayIdx = days.findIndex((d) => {
          const next = cloneDate(d); addDay(next);
          return event.start < next;
        });
        if (startDayIdx === -1) continue;
        const endDayIdx = days.findIndex((d) => d >= event.end);
        const endIdx = endDayIdx === -1 ? days.length : endDayIdx;
        const chip = createElement('div', theme.event, event.title || '', [
          ['data-event-id', event.id],
        ]);
        chip.style.position = 'absolute';
        chip.style.left = `${Math.max(0, startDayIdx) * dayWidth}px`;
        chip.style.width = `${Math.max(endIdx - Math.max(0, startDayIdx), 1) * dayWidth}px`;
        if (event.backgroundColor) chip.style.backgroundColor = event.backgroundColor;
        ribbon.append(chip);
      }
      row.append(ribbon);
      body.append(row);

      if (resource.expanded && hasChildren) {
        for (const child of payload.children) renderRow(child, depth + 1);
      }
    };

    // Walk only top-level resources; renderRow recurses.
    const tops = resources.filter((r) => (getPayload(r)?.level ?? 0) === 0);

    // Honour resourceExpand: 'all' | number | bool — auto-set expanded
    // before rendering.
    if (options.resourceExpand !== undefined) {
      const applyExpand = (r, depth) => {
        const p = getPayload(r);
        if (!p) return;
        if (options.resourceExpand === 'all' || options.resourceExpand === true ||
            (typeof options.resourceExpand === 'number' && depth < options.resourceExpand)) {
          r.expanded = true;
        }
        for (const c of p.children) applyExpand(c, depth + 1);
      };
      for (const r of tops) applyExpand(r, 0);
    }

    for (const r of tops) renderRow(r, 0);
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
