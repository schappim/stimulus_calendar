// ResourceTimeline view — time runs horizontally, resources stack
// vertically as rows.
//
// Structure (the user-visible "fixed first column" requires this DOM
// shape — sticky-left on per-row heads is unreliable inside large
// grid/flex containers, so the layout is explicit instead):
//
//   .ec-grid.ec-timeline               (CSS Grid: rowhead-w | 1fr)
//     .ec-timeline-corner              (top-left   — header + spacer)
//     .ec-timeline-day-axis            (top-right  — sticky day header
//                                         with overflow hidden; inner
//                                         track translates with the
//                                         strip pane's scrollLeft)
//     .ec-timeline-rowhead-col         (bottom-left — column of row
//                                         heads; overflow hidden, inner
//                                         track translates with the
//                                         strip pane's scrollTop)
//     .ec-timeline-strip-pane          (bottom-right — the ONLY real
//                                         scroll container; horizontal
//                                         + vertical scroll lives here)
//
// The renderer builds both the rowhead column and the strip pane in
// lock-step: a single iteration over the layout produces one row-head
// element in the left column and the matching strip element in the
// right pane. Vertical scrolling stays in sync because both columns
// translate against the same scrollTop; horizontal scrolling only
// moves the strip + day-axis.

import { createElement } from '../lib/dom.js';
import { cloneDate, addDay, setMidnight, datesEqual, createDate } from '../lib/date.js';
import { viewDates as viewDatesHelper } from '../lib/derived.js';
import { getPayload, setPayload } from '../lib/payload.js';
import { buildResourceGroupLayout } from '../lib/resource_groups.js';

export function renderResourceTimelineView(container, state) {
  const groupState = state.get('resourceGroupState') ?? new Map();
  state.set('resourceGroupState', groupState);

  let nowTickUnsub = null;
  let scrollSyncUnsub = null;

  const render = () => {
    if (nowTickUnsub) { nowTickUnsub(); nowTickUnsub = null; }
    if (scrollSyncUnsub) { scrollSyncUnsub(); scrollSyncUnsub = null; }
    const options = state.get('options');
    const theme = options.theme;
    const activeRange = state.get('activeRange');
    const resources = state.get('resources') ?? options.resources ?? [];
    if (!activeRange) return;

    const days = viewDatesHelper(activeRange, options.hiddenDays ?? []);
    const events = state.get('filteredEvents') ?? [];

    const slotMode = options.slotMode === 'hours' ? 'hours' : 'days';
    const hourStart = secondsOfDuration(options.slotMinTime) / 3600;
    const hourEnd   = secondsOfDuration(options.slotMaxTime) / 3600;
    const hoursPerDay = slotMode === 'hours'
      ? Math.max(1, Math.round(hourEnd - hourStart))
      : 1;
    const colWidth = slotMode === 'hours'
      ? (options.slotWidth ?? 48)
      : (options.slotWidth ?? 32);
    const totalCols = days.length * hoursPerDay;
    const totalWidth = totalCols * colWidth;

    const xForDate = (date) => {
      const idx = days.findIndex((d) => {
        const next = cloneDate(d); addDay(next);
        return date < next && date >= d;
      });
      if (slotMode === 'days') {
        if (idx === -1) {
          if (date < days[0]) return 0;
          return totalWidth;
        }
        return idx * colWidth;
      }
      let i = idx;
      if (i === -1) {
        if (date < days[0]) return 0;
        return totalWidth;
      }
      const midnight = setMidnight(cloneDate(days[i]));
      const minutesIntoDay = (date.getTime() - midnight.getTime()) / 60000;
      const clipped = Math.max(hourStart * 60, Math.min(hourEnd * 60, minutesIntoDay));
      const hoursIntoVisible = clipped / 60 - hourStart;
      return i * hoursPerDay * colWidth + hoursIntoVisible * colWidth;
    };

    const root = createElement('div', `${theme.grid} ec-timeline ec-resource ec-timeline-mode-${slotMode}`, '', [
      ['data-grid', 'resource-timeline'],
      ['data-slot-mode', slotMode],
    ]);
    if (options.dayHeaderTodayStyle === 'circle') {
      root.classList.add('ec-day-head-today-circle');
    }
    const rowHeight = state.get('rowHeight');
    if (rowHeight) root.style.setProperty('--ec-timeline-row-h', `${rowHeight}px`);

    // Four quadrants of the layout.
    const corner = createElement('div', 'ec-timeline-corner', '', [
      ['data-row', 'header'],
    ]);
    const dayAxis = createElement('div', 'ec-timeline-day-axis');
    const dayAxisInner = createElement('div', 'ec-timeline-day-axis-inner');
    dayAxis.append(dayAxisInner);
    const rowheadCol = createElement('div', 'ec-timeline-rowhead-col');
    const rowheadColInner = createElement('div', 'ec-timeline-rowhead-col-inner');
    rowheadCol.append(rowheadColInner);
    const stripPane = createElement('div', 'ec-timeline-strip-pane', '', [
      ['data-row', 'body'],
    ]);
    stripPane.style.position = 'relative';
    const stripsCol = createElement('div', 'ec-timeline-strips');
    stripsCol.style.width = `${totalWidth}px`;
    stripPane.append(stripsCol);

    root.append(corner, dayAxis, rowheadCol, stripPane);

    // ------ Day-axis header (top-right) ----------------------------------
    const dayLabelFmt = new Intl.DateTimeFormat(options.locale, { timeZone: 'UTC', ...options.dayHeaderFormat });
    const slotsHeader = createElement('div', theme.slots);
    slotsHeader.style.width = `${totalWidth}px`;
    const todayMid = setMidnight(createDate(new Date()));
    for (const day of days) {
      const isToday = datesEqual(todayMid, setMidnight(cloneDate(day)));
      const cell = createElement('div', `${theme.dayHead}${isToday ? ' ec-day-head-today' : ''}`, '', [
        ['data-day', String(day.getUTCDay())],
        ['data-date', day.toISOString().substring(0, 10)],
      ]);
      if (options.dayHeaderTodayStyle === 'circle' && isToday) {
        const label = dayLabelFmt.format(day);
        const dayNo = day.getUTCDate();
        const idx = label.indexOf(String(dayNo));
        if (idx >= 0) {
          const before = label.slice(0, idx);
          const after  = label.slice(idx + String(dayNo).length);
          if (before) cell.append(document.createTextNode(before));
          const disc = createElement('span', 'ec-day-head-today-disc', String(dayNo));
          cell.append(disc);
          if (after) cell.append(document.createTextNode(after));
        } else {
          cell.textContent = label;
        }
      } else {
        cell.textContent = dayLabelFmt.format(day);
      }
      cell.style.width = `${colWidth * hoursPerDay}px`;
      slotsHeader.append(cell);
    }
    dayAxisInner.append(slotsHeader);

    // Hour strip — only in hours mode.
    if (slotMode === 'hours') {
      const hourFmt = new Intl.DateTimeFormat(options.locale, { timeZone: 'UTC', hour: 'numeric' });
      const hoursStrip = createElement('div', `${theme.slots} ec-timeline-hour-strip`);
      hoursStrip.style.width = `${totalWidth}px`;
      for (let di = 0; di < days.length; ++di) {
        for (let h = 0; h < hoursPerDay; ++h) {
          const hourDate = cloneDate(days[di]);
          hourDate.setUTCHours(hourStart + h, 0, 0, 0);
          const cell = createElement('div', `${theme.dayHead} ec-hour-head`, hourFmt.format(hourDate), [
            ['data-hour', String(hourStart + h)],
          ]);
          cell.style.width = `${colWidth}px`;
          hoursStrip.append(cell);
        }
      }
      dayAxisInner.append(hoursStrip);
    }

    // ------ Resource layout (build groups + reverse index) ---------------
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
    const groupByResourceId = new Map();
    for (const g of groupsById.values()) {
      for (const rid of g.resourceIds) groupByResourceId.set(rid, g);
    }
    const groupOf = (r) => groupByResourceId.get(r.id) ?? null;

    // ------ Today band + NOW line (inside strip pane) --------------------
    let todayIdx = -1;
    for (let i = 0; i < days.length; i++) {
      if (datesEqual(todayMid, setMidnight(cloneDate(days[i])))) { todayIdx = i; break; }
    }
    if (todayIdx >= 0) {
      const todayDayLeft = todayIdx * hoursPerDay * colWidth;
      const dayBandWidth = colWidth * hoursPerDay;
      const tint = createElement('div', 'ec-timeline-today-band', '', [
        ['data-today-band', ''],
      ]);
      tint.style.position = 'absolute';
      tint.style.top = '0';
      tint.style.bottom = '0';
      tint.style.left  = `${todayDayLeft}px`;
      tint.style.width = `${dayBandWidth}px`;
      tint.style.pointerEvents = 'none';
      stripsCol.append(tint);

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
        const dayMid = days[todayIdx];
        const reposition = (nowDate) => {
          const n = nowDate instanceof Date ? nowDate : createDate(new Date());
          const minsIntoDay = (n.getTime() - dayMid.getTime()) / 60000;
          let xWithinDay;
          if (slotMode === 'hours') {
            const clipped = Math.max(hourStart * 60, Math.min(hourEnd * 60, minsIntoDay));
            xWithinDay = (clipped - hourStart * 60) / 60 * colWidth;
          } else {
            const clipped = Math.max(0, Math.min(1440, minsIntoDay));
            xWithinDay = (clipped / 1440) * colWidth;
          }
          nowLine.style.left = `${todayDayLeft + xWithinDay}px`;
        };
        reposition(state.get('now'));
        stripsCol.append(nowLine);
        nowTickUnsub = state.on('change:now', ({ value }) => reposition(value));
      }
    }

    // ------ Per-row rendering (both columns in lock-step) ----------------
    const renderGroupHeader = (group) => {
      const headRow = createElement('div', `${theme.groupHeader} ec-group-row-head`, '', [
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
      headRow.append(head);
      rowheadColInner.append(headRow);

      const strip = createElement('div', `${theme.groupHeader} ec-group-header-strip`, '', [
        ['data-strip-row', 'group-header'],
        ['data-group-id', group.id],
      ]);
      strip.style.width = `${totalWidth}px`;
      stripsCol.append(strip);

      const mountFn = options.groupHeaderDidMount;
      if (typeof mountFn === 'function') {
        queueMicrotask(() => mountFn({ group, el: headRow, view: state.get('view') }));
      }
    };

    const renderRow = (resource, depth) => {
      const payload = getPayload(resource);
      if (payload?.hidden) return;

      // Row-head (left column).
      const headEl = createElement('div', 'ec-timeline-row-head', '', [
        ['data-row-head', resource.id],
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
      headEl.append(head);
      rowheadColInner.append(headEl);

      // Strip (right pane).
      const stripRow = createElement('div', 'ec-timeline-row', '', [
        ['data-resource-id', resource.id],
        ['data-depth', String(depth)],
      ]);
      const ribbon = createElement('div', 'ec-timeline-ribbon');
      ribbon.style.position = 'relative';
      ribbon.style.minHeight = '30px';
      ribbon.style.width = `${totalWidth}px`;

      if (slotMode === 'hours' && options.lunchHour != null) {
        const lh = Number(options.lunchHour);
        if (Number.isFinite(lh) && lh >= hourStart && lh < hourEnd) {
          for (let di = 0; di < days.length; ++di) {
            const band = createElement('div', 'ec-timeline-lunch-band');
            const leftPx = (di * hoursPerDay + (lh - hourStart)) * colWidth;
            band.style.position = 'absolute';
            band.style.top = '0';
            band.style.bottom = '0';
            band.style.left = `${leftPx}px`;
            band.style.width = `${colWidth}px`;
            band.style.pointerEvents = 'none';
            ribbon.append(band);
          }
        }
      }

      // Cells layer (empty-cell affordance + cellClick).
      const cellsLayer = createElement('div', 'ec-timeline-cells');
      cellsLayer.style.position = 'absolute';
      cellsLayer.style.inset = '0';
      cellsLayer.style.display = 'grid';
      cellsLayer.style.gridTemplateColumns = `repeat(${totalCols}, ${colWidth}px)`;
      cellsLayer.style.pointerEvents = 'none';
      const fire = state.get('fire');
      for (let di = 0; di < days.length; ++di) {
        const day = days[di];
        for (let h = 0; h < hoursPerDay; ++h) {
          const cellDate = cloneDate(day);
          if (slotMode === 'hours') cellDate.setUTCHours(hourStart + h, 0, 0, 0);
          const isDayBoundary = h === 0;
          const isWeekBoundary = slotMode === 'days' && di > 0 && di % 7 === 0 && h === 0;
          const cell = createElement('div',
            `ec-timeline-cell${isDayBoundary ? ' ec-timeline-cell-day-edge' : ''}${isWeekBoundary ? ' ec-timeline-cell-week-edge' : ''}`, '', [
            ['data-date', day.toISOString().substring(0, 10)],
            ['data-day',  String(day.getUTCDay())],
            ...(slotMode === 'hours' ? [['data-hour', String(hourStart + h)]] : []),
          ]);
          cell.style.pointerEvents = 'auto';
          const addOpt = options.emptyCellAddButton;
          if (addOpt) {
            const btn = createElement('span', 'ec-timeline-cell-add', '+');
            if (typeof addOpt === 'function') {
              const c = addOpt({ date: cellDate, resource, group: groupOf(resource) });
              if (typeof c === 'string') btn.textContent = c;
              else if (c?.html) btn.innerHTML = c.html;
              else if (c?.domNodes) { btn.textContent = ''; c.domNodes.forEach((n) => btn.append(n)); }
            }
            cell.append(btn);
          }
          cell.addEventListener('click', (jsEvent) => {
            fire?.('cellClick', {
              date: cellDate, resource, group: groupOf(resource),
              jsEvent, view: state.get('view'),
            });
          });
          cellsLayer.append(cell);
        }
      }
      ribbon.append(cellsLayer);

      const resourceEvents = events.filter((e) =>
        e.resourceIds.length === 0 || e.resourceIds.includes(resource.id));
      for (const event of resourceEvents) {
        const xL = xForDate(event.start);
        const xR = xForDate(event.end);
        if (xR <= 0 || xL >= totalWidth) continue;
        const left  = Math.max(0, xL);
        const right = Math.min(totalWidth, xR);
        const width = Math.max(colWidth / 4, right - left);

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
        chip.style.left = `${left}px`;
        chip.style.width = `${width}px`;
        if (event.backgroundColor) chip.style.setProperty('--ec-event-color', event.backgroundColor);

        if (width < Number(options.eventNarrowThreshold ?? 60)) chip.classList.add('ec-event-narrow');
        if (typeof ResizeObserver !== 'undefined') {
          const ro = new ResizeObserver(() => {
            const w = chip.getBoundingClientRect().width;
            chip.classList.toggle('ec-event-narrow', w < Number(options.eventNarrowThreshold ?? 60));
          });
          ro.observe(chip);
        }

        if (options.editable && options.eventDurationEditable !== false) {
          const endHandle = createElement('div',
            `${options.theme.resizer ?? 'ec-resizer'} ec-resizer-x ec-resizer-x-end`, '', [
            ['data-resizer', 'end'],
            ['data-resize-axis', 'x'],
          ]);
          chip.append(endHandle);
          if (options.eventResizableFromStart) {
            const startHandle = createElement('div',
              `${options.theme.resizer ?? 'ec-resizer'} ec-resizer-x ec-resizer-x-start`, '', [
              ['data-resizer', 'start'],
              ['data-resize-axis', 'x'],
            ]);
            chip.append(startHandle);
          }
        }

        chip.addEventListener('click',     (jsEvent) => fire?.('eventClick',      { event, jsEvent, view: state.get('view'), resource }));
        chip.addEventListener('dblclick',  (jsEvent) => fire?.('eventDoubleClick',{ event, jsEvent, view: state.get('view'), resource, el: chip }));
        chip.addEventListener('mouseenter',(jsEvent) => fire?.('eventMouseEnter', { event, jsEvent, view: state.get('view'), resource }));
        chip.addEventListener('mouseleave',(jsEvent) => fire?.('eventMouseLeave', { event, jsEvent, view: state.get('view'), resource }));
        queueMicrotask(() => fire?.('eventDidMount', { event, el: chip, view: state.get('view'), resource }));
        ribbon.append(chip);
      }
      stripRow.append(ribbon);
      stripsCol.append(stripRow);

      if (resource.expanded && hasChildren) {
        for (const child of payload.children) renderRow(child, depth + 1);
      }
    };

    for (const entry of layout) {
      if (entry.kind === 'group') renderGroupHeader(entry.group);
      else renderRow(entry.resource, 0);
    }

    if (options.allowPinchZoom) attachPinchHandler(stripPane, state, options);

    container.replaceChildren(root);

    // ------ Scroll synchronisation -------------------------------------
    // The strip pane is the sole real scroll container. Translate the
    // inner tracks of the day-axis (horizontal) and rowhead column
    // (vertical) so the fixed first column stays glued to the left and
    // the day header stays glued to the top.
    const onStripScroll = () => {
      dayAxisInner.style.transform = `translateX(${-stripPane.scrollLeft}px)`;
      rowheadColInner.style.transform = `translateY(${-stripPane.scrollTop}px)`;
    };
    stripPane.addEventListener('scroll', onStripScroll, { passive: true });
    scrollSyncUnsub = () => stripPane.removeEventListener('scroll', onStripScroll);
    // Initial sync (in case the renderer is re-mounted at a non-zero
    // scroll position).
    onStripScroll();
  };

  render();
  const off = state.onAny(({ key }) => {
    if (['options', 'currentRange', 'activeRange', 'viewDates',
         'filteredEvents', 'resources', 'rowHeight'].includes(key)) render();
  });

  return () => {
    off();
    if (nowTickUnsub) { nowTickUnsub(); nowTickUnsub = null; }
    if (scrollSyncUnsub) { scrollSyncUnsub(); scrollSyncUnsub = null; }
    container.replaceChildren();
  };
}

function secondsOfDuration(d) {
  if (!d) return 0;
  return (d.days ?? 0) * 86400 + (d.seconds ?? 0);
}

function attachPinchHandler(bodyEl, state, options) {
  let pinch = null;
  const onTouchStart = (e) => {
    if (e.touches.length !== 2) return;
    pinch = {
      startDist: distance(e.touches[0], e.touches[1]),
      startHeight: state.get('rowHeight') ?? options.compactRowHeight ?? 52,
    };
  };
  const onTouchMove = (e) => {
    if (!pinch || e.touches.length !== 2) return;
    const dist = distance(e.touches[0], e.touches[1]);
    if (Math.abs(dist - pinch.startDist) < 14) return;
    const want = dist > pinch.startDist
      ? Number(options.comfyRowHeight ?? 88)
      : Number(options.compactRowHeight ?? 52);
    if (want !== state.get('rowHeight')) {
      state.set('rowHeight', want);
      state.get('fire')?.('rowHeightChange', { height: want });
    }
    e.preventDefault();
  };
  const onTouchEnd = () => { pinch = null; };
  bodyEl.addEventListener('touchstart', onTouchStart, { passive: false });
  bodyEl.addEventListener('touchmove',  onTouchMove,  { passive: false });
  bodyEl.addEventListener('touchend',   onTouchEnd,   { passive: true });
  bodyEl.addEventListener('touchcancel',onTouchEnd,   { passive: true });
}

function distance(t1, t2) {
  const dx = t1.clientX - t2.clientX;
  const dy = t1.clientY - t2.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}
