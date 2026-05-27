// ResourceTimeline view — time runs horizontally, resources stack
// vertically as rows. Phase 9 ships the skeleton: header timeline with
// day labels, one row per resource (with title + horizontal event ribbon),
// optional expand/collapse for nested resources.
//
// Phase A1 layers resource groups on top: an ordered list of
// { kind: 'group' | 'resource', … } entries built from
// options.resourceGroups / resourceGroupField. A group renders as a
// single header row (chevron + swatch + title + count + action slot) and
// hides its members when collapsed. Resources outside every group render
// flat below all groups.

import { createElement } from '../lib/dom.js';
import { cloneDate, addDay, setMidnight, datesEqual, createDate } from '../lib/date.js';
import { viewDates as viewDatesHelper } from '../lib/derived.js';
import { getPayload, setPayload } from '../lib/payload.js';
import { buildResourceGroupLayout } from '../lib/resource_groups.js';

export function renderResourceTimelineView(container, state) {
  // Per-controller group expansion state. Persists across re-renders
  // (so toggling a chevron doesn't reset on the next event-change tick)
  // but lives on this closure, not on the resource itself.
  const groupState = state.get('resourceGroupState') ?? new Map();
  state.set('resourceGroupState', groupState);

  // NOW-line subscription. Re-created on every full render so the line
  // can re-anchor when the view's day-strip changes; torn down before
  // the next render (and on view destroy) so a stale closure doesn't
  // keep mutating a detached node.
  let nowTickUnsub = null;

  const render = () => {
    if (nowTickUnsub) { nowTickUnsub(); nowTickUnsub = null; }
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

    // Body — rows. Phase A1: group-aware layout. We walk only top-level
    // resources (nested-resource expand/collapse stays as a sub-layer
    // inside renderRow).
    const tops = resources.filter((r) => (getPayload(r)?.level ?? 0) === 0);

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

    const { layout, groupsById } = buildResourceGroupLayout({
      resources: tops,
      resourceGroups: options.resourceGroups,
      resourceGroupField: options.resourceGroupField,
      groupState,
    });
    state.set('resourceGroupsById', groupsById);

    // Reverse index: resourceId → group. Used by per-cell event payloads
    // so the host doesn't have to thread the groups list through every
    // cellClick handler.
    const groupByResourceId = new Map();
    for (const g of groupsById.values()) {
      for (const rid of g.resourceIds) groupByResourceId.set(rid, g);
    }
    const groupOf = (r) => groupByResourceId.get(r.id) ?? null;

    const body = createElement('div', 'ec-timeline-body', '', [['data-row', 'body']]);
    body.style.position = 'relative';

    // Phase A4 — TODAY column tint + NOW vertical line.
    //
    // Both are absolute-positioned overlays inside the body. Today's
    // column index drives a translucent band that spans every row from
    // its first row's top to the last row's bottom; the NOW line is a
    // 2 px vertical rule positioned at
    //     (now − dayStart) / dayMs * dayWidth
    // inside today's column.
    //
    // The NOW line subscribes to state.now (ticked every second by
    // nowAndTodayEffect) so it slides across the column as wall-clock
    // minutes advance — no re-render. Suppressed unless
    // options.nowIndicator is true (mirrors TimeGrid).
    const today = setMidnight(createDate(new Date()));
    let todayIdx = -1;
    for (let i = 0; i < days.length; i++) {
      if (datesEqual(today, setMidnight(cloneDate(days[i])))) { todayIdx = i; break; }
    }
    if (todayIdx >= 0) {
      const tint = createElement('div', 'ec-timeline-today-band', '', [
        ['data-today-band', ''],
      ]);
      tint.style.position = 'absolute';
      tint.style.top = '0';
      tint.style.bottom = '0';
      tint.style.left  = `calc(var(--ec-timeline-rowhead-w, 160px) + ${todayIdx * slotWidth}px)`;
      tint.style.width = `${slotWidth}px`;
      tint.style.pointerEvents = 'none';
      body.append(tint);

      if (options.nowIndicator) {
        const nowLine = createElement('div', 'ec-timeline-now-line', '', [
          ['data-now-indicator', ''],
        ]);
        nowLine.style.position = 'absolute';
        nowLine.style.top = '0';
        nowLine.style.bottom = '0';
        nowLine.style.width = '2px';
        nowLine.style.background = 'var(--ec-now-indicator-color, #dc2626)';
        nowLine.style.pointerEvents = 'none';
        nowLine.style.zIndex = '4';
        const dayStart = days[todayIdx].getTime();
        const reposition = (nowDate) => {
          const n = nowDate instanceof Date ? nowDate : createDate(new Date());
          const minsIntoDay = ((n.getTime() - dayStart) / 60000);
          const clamped = Math.max(0, Math.min(1440, minsIntoDay));
          const xWithinCol = (clamped / 1440) * slotWidth;
          nowLine.style.left =
            `calc(var(--ec-timeline-rowhead-w, 160px) + ${todayIdx * slotWidth + xWithinCol}px)`;
        };
        reposition(state.get('now'));
        body.append(nowLine);
        nowTickUnsub = state.on('change:now', ({ value }) => reposition(value));
      }
    }

    const renderGroupHeader = (group) => {
      const row = createElement('div', `ec-timeline-row ${theme.groupHeader}`, '', [
        ['data-row', 'group-header'],
        ['data-group-id', group.id],
        ['data-expanded', group.expanded ? 'true' : 'false'],
      ]);
      const head = createElement('div', `${theme.rowHead} ec-group-head`);
      const toggle = createElement('button', theme.groupHeaderToggle, '', [
        ['type', 'button'],
        ['aria-label', group.expanded ? 'Collapse' : 'Expand'],
        ['aria-expanded', String(group.expanded)],
      ]);
      toggle.innerHTML = group.expanded
        ? (options.icons.collapse?.html ?? '−')
        : (options.icons.expand?.html ?? '+');
      toggle.addEventListener('click', () => {
        const next = !group.expanded;
        groupState.set(group.id, next);
        group.expanded = next;
        const fire = state.get('fire');
        fire?.(next ? 'groupExpand' : 'groupCollapse', {
          groupId: group.id, view: state.get('view'),
        });
        render();
      });
      head.append(toggle);

      const swatch = createElement('span', theme.groupHeaderSwatch);
      if (group.color) swatch.style.background = group.color;
      head.append(swatch);

      head.append(createElement('span', theme.groupHeaderName, group.title));
      head.append(createElement('span', theme.groupHeaderCount, `${group.resourceIds.length}`));

      // Right-hand action slot — host can supply an HTML / text recipe via
      // options.groupHeaderContent({ group, view }) or wire a click on
      // [data-group-header-action] from the calendar:groupExpand event.
      const actionSlot = createElement('span', theme.groupHeaderAction, '', [
        ['data-group-header-action', ''],
      ]);
      const contentFn = options.groupHeaderContent;
      if (typeof contentFn === 'function') {
        const c = contentFn({ group, view: state.get('view') });
        if (typeof c === 'string') actionSlot.textContent = c;
        else if (c?.html) actionSlot.innerHTML = c.html;
        else if (c?.domNodes) c.domNodes.forEach((n) => actionSlot.append(n));
      }
      head.append(actionSlot);

      row.append(head);

      // Strip cell — empty placeholder spanning the timeline width so
      // the bottom border lines up with regular rows.
      const strip = createElement('div', 'ec-group-header-strip');
      strip.style.width = `${days.length * slotWidth}px`;
      row.append(strip);
      body.append(row);

      const mountFn = options.groupHeaderDidMount;
      if (typeof mountFn === 'function') {
        queueMicrotask(() => mountFn({ group, el: row, view: state.get('view') }));
      }
    };

    const renderRow = (resource, depth) => {
      const payload = getPayload(resource);
      if (payload?.hidden) return;
      const row = createElement('div', 'ec-timeline-row', '', [
        ['data-resource-id', resource.id],
        ['data-depth', String(depth)],
      ]);
      const head = createElement('div', theme.rowHead, '', [['data-resource-label', '']]);
      head.style.setProperty('--ec-row-head-indent', `${depth * 16}px`);

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

      // Phase A3 — empty-cell layer. Each day in this resource's strip
      // gets a tap-target cell sitting behind the bars. Hover/focus
      // reveals a centred `＋` (only when emptyCellAddButton is opt-in)
      // and tap fires cellClick with { date, resource, group, jsEvent }.
      // Drawn BEFORE the bars so absolute-positioned chips paint on top
      // and a tap that lands on a bar still hits the bar's click handler.
      const cellsLayer = createElement('div', 'ec-timeline-cells');
      cellsLayer.style.position = 'absolute';
      cellsLayer.style.inset = '0';
      cellsLayer.style.display = 'grid';
      cellsLayer.style.gridTemplateColumns = `repeat(${days.length}, ${dayWidth}px)`;
      cellsLayer.style.pointerEvents = 'none';
      const fire = state.get('fire');
      for (let i = 0; i < days.length; i++) {
        const day = days[i];
        const cell = createElement('div', 'ec-timeline-cell', '', [
          ['data-date', day.toISOString().substring(0, 10)],
          ['data-day',  String(day.getUTCDay())],
        ]);
        cell.style.pointerEvents = 'auto';
        // Optional `＋` glyph for the host. Three shapes:
        //   true                 → built-in centred plus
        //   ({date, resource}) → custom recipe ({ html | domNodes | textContent })
        //   false / undefined    → no glyph (cell still listens for tap)
        const addOpt = options.emptyCellAddButton;
        if (addOpt) {
          const btn = createElement('span', 'ec-timeline-cell-add', '+');
          if (typeof addOpt === 'function') {
            const c = addOpt({ date: day, resource, group: groupOf(resource) });
            if (typeof c === 'string') btn.textContent = c;
            else if (c?.html) btn.innerHTML = c.html;
            else if (c?.domNodes) { btn.textContent = ''; c.domNodes.forEach((n) => btn.append(n)); }
          }
          cell.append(btn);
        }
        cell.addEventListener('click', (jsEvent) => {
          fire?.('cellClick', {
            date: day, resource, group: groupOf(resource),
            jsEvent, view: state.get('view'),
          });
        });
        cellsLayer.append(cell);
      }
      ribbon.append(cellsLayer);
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
        const chipClasses = [theme.event];
        const globalCls = options.eventClassNames;
        if (typeof globalCls === 'function') {
          const c = globalCls({ event });
          if (c) chipClasses.push(...(Array.isArray(c) ? c : [c]));
        } else if (globalCls) {
          chipClasses.push(...(Array.isArray(globalCls) ? globalCls : [globalCls]));
        }
        if (event.classNames) chipClasses.push(...(Array.isArray(event.classNames) ? event.classNames : [event.classNames]));
        const chip = createElement('div', chipClasses.filter(Boolean).join(' '), event.title || '', [
          ['data-event-id', event.id],
        ]);
        chip.style.position = 'absolute';
        chip.style.left = `${Math.max(0, startDayIdx) * dayWidth}px`;
        chip.style.width = `${Math.max(endIdx - Math.max(0, startDayIdx), 1) * dayWidth}px`;
        if (event.backgroundColor) chip.style.setProperty('--ec-event-color', event.backgroundColor);
        const fire = state.get('fire');
        chip.addEventListener('click',     (jsEvent) => fire?.('eventClick',      { event, jsEvent, view: state.get('view'), resource }));
        chip.addEventListener('dblclick',  (jsEvent) => fire?.('eventDoubleClick',{ event, jsEvent, view: state.get('view'), resource, el: chip }));
        chip.addEventListener('mouseenter',(jsEvent) => fire?.('eventMouseEnter', { event, jsEvent, view: state.get('view'), resource }));
        chip.addEventListener('mouseleave',(jsEvent) => fire?.('eventMouseLeave', { event, jsEvent, view: state.get('view'), resource }));
        queueMicrotask(() => fire?.('eventDidMount', { event, el: chip, view: state.get('view'), resource }));
        ribbon.append(chip);
      }
      row.append(ribbon);
      body.append(row);

      if (resource.expanded && hasChildren) {
        for (const child of payload.children) renderRow(child, depth + 1);
      }
    };

    for (const entry of layout) {
      if (entry.kind === 'group') renderGroupHeader(entry.group);
      else renderRow(entry.resource, 0);
    }

    root.append(body);
    container.replaceChildren(root);
  };

  render();
  const off = state.onAny(({ key }) => {
    if (['options', 'currentRange', 'activeRange', 'viewDates',
         'filteredEvents', 'resources'].includes(key)) render();
  });

  return () => {
    off();
    if (nowTickUnsub) { nowTickUnsub(); nowTickUnsub = null; }
    container.replaceChildren();
  };
}
