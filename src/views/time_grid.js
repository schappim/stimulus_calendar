// TimeGrid renderer — sidebar with time-slot labels + N day columns + a
// slot grid. Each day column has an absolute-positioned overlay where
// events are placed by their start/end times. Phase 6 ships the skeleton
// + slot rendering; subsequent commits add allDay, options, now indicator.

import { createElement } from '../lib/dom.js';
import { cloneDate, addDay, setMidnight, datesEqual, toISOString, addDuration, createDate } from '../lib/date.js';
import { createSlots, createSlotTimeLimits } from '../lib/slots.js';
import { viewDates as viewDatesHelper } from '../lib/derived.js';
import { assignOverlapLanes } from '../lib/events.js';
import {
  eventMetaClassNames,
  eventMetaDataAttrs,
  buildRecurringBadge,
} from '../lib/event_meta.js';

export function renderTimeGridView(container, state) {
  // Persist user-scrolled vertical offset across re-renders so that
  // mutations triggered by editing an event (updateEvent during resize /
  // drag) don't snap the body scroll back to options.scrollTime.
  let savedScrollTop = null;
  // Per-render subscription that keeps the now-indicator's top in sync
  // with state.now. Torn down before each re-render (and on view
  // destroy) so a stale closure can't keep mutating a detached node.
  let nowTickUnsub = null;
  const render = () => {
    if (nowTickUnsub) { nowTickUnsub(); nowTickUnsub = null; }
    const options = state.get('options');
    const theme = options.theme;
    const activeRange = state.get('activeRange');
    if (!activeRange) return;
    // Capture the previous body's scrollTop before we tear down its DOM.
    // The body is the single scroll container for the sidebar + day cols,
    // so they scroll together natively in lockstep (no JS scroll-sync).
    const prevBody = container.querySelector('[data-row="body"]');
    if (prevBody) savedScrollTop = prevBody.scrollTop;

    const days = viewDatesHelper(activeRange, options.hiddenDays ?? []);

    const root = createElement('div', `${theme.grid} ec-time-grid`, '', [
      ['data-grid', 'time-grid'],
    ]);
    // Drive every child grid (header, all-day, body's .ec-days) off the
    // SAME column count so a non-7-day view (e.g. duration:{days:3})
    // doesn't leave the header laid out as if it were a 7-day week with
    // 3 cells crammed into the first 3 slots of 7. The header's CSS
    // grid-template-columns falls back to 7 when --ec-cols is unset, so
    // setting it on the root lets it cascade.
    root.style.setProperty('--ec-cols', String(days.length));

    // Day-of-week header row (with leading spacer aligned to sidebar).
    const header = createElement('div', `${theme.colHead}`, '', [
      ['data-row', 'header'],
    ]);
    header.append(createElement('div', `${theme.sidebar} ec-corner`));
    const headerFmt = new Intl.DateTimeFormat(options.locale, { timeZone: 'UTC', ...options.dayHeaderFormat });
    const dotsOpt = options.dayHeaderDensity;
    // Density-dot input — pull events here (filtered isn't defined yet
    // at this point in the renderer).
    const filteredForDots = dotsOpt ? (state.get('filteredEvents') ?? []) : [];
    const countOn = (day) => {
      const next = cloneDate(day); addDay(next);
      return filteredForDots.filter((e) => e.start < next && e.end > day).length;
    };
    for (const d of days) {
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
      header.append(head);
    }
    root.append(header);

    const filtered = state.get('filteredEvents') ?? [];

    // All-day row — a horizontal strip across the top showing all-day
    // events per day. Suppressed when options.allDaySlot is false.
    if (options.allDaySlot) {
      const allDayRow = createElement('div', theme.allDay, '', [
        ['data-row', 'all-day'],
      ]);
      const allDayLabel = createElement('div', theme.sidebar + ' ec-all-day-label');
      const labelContent = options.allDayContent;
      if (typeof labelContent === 'function') {
        const c = labelContent({ view: state.get('view') });
        if (typeof c === 'string') allDayLabel.textContent = c;
        else if (c?.html) allDayLabel.innerHTML = c.html;
      } else if (typeof labelContent === 'string') {
        allDayLabel.textContent = labelContent;
      } else if (labelContent?.html) {
        allDayLabel.innerHTML = labelContent.html;
      } else {
        allDayLabel.textContent = 'all-day';
      }
      allDayRow.append(allDayLabel);
      const allDayCols = createElement('div', 'ec-all-day-cols');
      allDayCols.style.setProperty('--ec-cols', String(days.length));
      const cells = [];
      for (const day of days) {
        const cell = createElement('div', `${theme.day} ec-all-day-cell`, '', [
          ['data-date', day.toISOString().substring(0, 10)],
        ]);
        allDayCols.append(cell);
        cells.push(cell);
      }
      // Render each visible all-day event as ONE chip anchored to its
      // first visible day, with width = (visible day count) cells. The
      // chip's title sits at the left of its visible portion, so the
      // label is never clipped off-screen for events that started in a
      // previous week. Chips overflow into the cells they span via a
      // calc() width — adjacent days don't render their own chips for
      // the same event.
      const allDayEvents = filtered.filter((e) => e.allDay);
      for (const event of allDayEvents) {
        let firstIdx = -1, lastIdx = -1;
        for (let i = 0; i < days.length; ++i) {
          const d = days[i];
          const next = cloneDate(d); addDay(next);
          if (event.start < next && event.end > d) {
            if (firstIdx === -1) firstIdx = i;
            lastIdx = i;
          }
        }
        if (firstIdx === -1) continue;
        const span = lastIdx - firstIdx + 1;
        const chip = createElement('div', theme.event, '', [
          ['data-event-id', event.id],
          ...eventMetaDataAttrs(event),
        ]);
        if (event.backgroundColor) chip.style.backgroundColor = event.backgroundColor;
        chip.style.position = 'absolute';
        chip.style.left = '1px';
        chip.style.right = 'auto';
        chip.style.top = '2px';
        // width = N column-widths + (N-1) col-border widths, minus the
        // 2px of left/right margin we steal back for the gap.
        chip.style.width = `calc(${span * 100}% + ${(span - 1)}px - 2px)`;
        chip.style.overflow = 'hidden';
        chip.append(createElement('div', theme.eventTitle, event.title || ''));
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
        cells[firstIdx].append(chip);
      }
      allDayRow.append(allDayCols);
      root.append(allDayRow);
    }

    // Body: sidebar + per-day columns inside ONE scroll container.
    //
    // The body is `display: grid; overflow-y: auto`, and both the
    // sidebar (hour labels) and the day columns are direct grid items.
    // They share the same scroll layer, so vertical scrolling is 1:1
    // pixel-perfect with no JS involvement — the browser paints the
    // gutter and the events together every frame.
    const body = createElement('div', 'ec-time-body', '', [
      ['data-row', 'body'],
    ]);
    const slotTimeLimits = createSlotTimeLimits(
      options.slotMinTime, options.slotMaxTime,
      options.flexibleSlotTimeLimits, days, filtered,
    );
    const slotLabelFmt = {
      format: (d) => new Intl.DateTimeFormat(options.locale, { timeZone: 'UTC', ...options.slotLabelFormat }).format(d),
    };
    const slotLabelPeriodicity = computePeriodicity(options.slotLabelInterval, options.slotDuration);
    const slots = createSlots(
      activeRange.start, options.slotDuration, slotLabelPeriodicity, slotTimeLimits, slotLabelFmt,
    );

    // Sidebar — slot label column. macOS-Calendar style: the hour
    // number is the dominant glyph; the am/pm suffix is smaller and
    // muted; 12 pm and 12 am are special-cased to "Noon" and "Midnight".
    const sidebar = createElement('div', theme.sidebar);
    for (const [iso, label] of slots) {
      const cell = createElement('div', theme.slot, '');
      cell.style.height = `${options.slotHeight}px`;
      // macOS-style time axis labels only the hour rows. Half-hour
      // (and finer) slots stay blank — the rule across the day column
      // gives the eye enough information to estimate sub-hour positions.
      if (label) {
        // iso comes from toISOString().substring(0, 19) — the trailing
        // 'Z' is stripped, so new Date(iso) would parse as local time
        // and getUTCHours() would shift by the TZ offset (e.g. in
        // Sydney +10 the first 00:00 slot reads as 14:00 → "2 pm").
        // Re-add the Z so the slot's wall-clock matches its label.
        const date = new Date(iso + 'Z');
        const hours = date.getUTCHours();
        const mins = date.getUTCMinutes();
        if (mins !== 0) {
          // skip non-hour slots
        } else if (hours === 12) {
          cell.append(createElement('span', 'ec-slot-hour', 'Noon'));
        } else {
          // Hour 0 falls through to "12 am" — the gutter is 56px wide
          // on mobile and "Midnight" overflows it visibly. "12 am"
          // matches every other hour's compact "<n> am/pm" format.
          const h12 = (hours % 12) || 12;
          const period = hours >= 12 ? 'pm' : 'am';
          cell.append(createElement('span', 'ec-slot-hour', String(h12)));
          cell.append(createElement('span', 'ec-slot-period', period));
        }
      }
      sidebar.append(cell);
    }
    body.append(sidebar);

    // Day columns — direct grid sibling of the sidebar inside the body.
    const colsWrap = createElement('div', theme.grid + ' ec-days');
    colsWrap.style.setProperty('--ec-cols', String(days.length));
    if (options.columnWidth) colsWrap.style.setProperty('--ec-col-w', `${options.columnWidth}px`);
    for (const day of days) {
      const col = createElement('div', `${theme.day} ec-time-col`, '', [
        ['data-date', day.toISOString().substring(0, 10)],
      ]);
      // Slot lines down the column.
      for (let i = 0; i < slots.length; ++i) {
        const slotEl = createElement('div', theme.slot);
        slotEl.style.height = `${options.slotHeight}px`;
        col.append(slotEl);
      }
      // Event overlay (absolute-positioned).
      const overlay = createElement('div', 'ec-event-overlay');
      const dayEvents = eventsOnDay(filtered, day).filter((e) => !e.allDay);
      // Pre-compute each event's day-clipped [visStart, visEnd) window and
      // assign overlap lanes so simultaneously-running events render as a
      // staircase — the back chip stays clickable on its exposed left
      // strip instead of being entirely covered by the front chip.
      const dayMidShared = setMidnight(cloneDate(day));
      const nextDayMidShared = cloneDate(dayMidShared); addDay(nextDayMidShared);
      const eventBounds = new Map();
      for (const e of dayEvents) {
        const startsBefore = e.start < dayMidShared;
        const endsAfter = e.end > nextDayMidShared;
        eventBounds.set(e, {
          visStart: startsBefore ? dayMidShared : e.start,
          visEnd:   endsAfter    ? nextDayMidShared : e.end,
          startsBefore, endsAfter,
        });
      }
      // Background events (display:'background') don't compete with regular
      // chips for lane space — they paint a translucent band behind
      // everything. Exclude them from lane assignment so a real chip that
      // overlaps a band still lands at lane 0.
      const laneWrappers = dayEvents
        .filter((e) => e.display !== 'background')
        .map((e) => ({
          start: eventBounds.get(e).visStart,
          end:   eventBounds.get(e).visEnd,
          event: e,
        }));
      const laneMap = assignOverlapLanes(laneWrappers);
      const laneByEvent = new Map();
      for (const w of laneWrappers) laneByEvent.set(w.event, laneMap.get(w));
      const LANE_OFFSET_PX = 16;
      const minutesPerSlot = (totalSeconds(options.slotDuration) / 60);
      const slotMinMin = totalSeconds(slotTimeLimits.min) / 60;
      const pxPerMin = options.slotHeight / minutesPerSlot;
      for (const event of dayEvents) {
        const bounds = eventBounds.get(event);
        const { visStart, visEnd, startsBefore, endsAfter } = bounds;
        const startMin = ((visStart.getTime() - dayMidShared.getTime()) / 60_000) - slotMinMin;
        const endMin = ((visEnd.getTime() - dayMidShared.getTime()) / 60_000) - slotMinMin;

        // Background bands: full-width, behind regular chips, no content.
        // The eventClassNames hook still runs so the host app can paint a
        // distinct pattern (hatched, striped, etc.) per band.
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
          // eventContent runs for bg events too — TimeGrid bands are tall
          // enough to display a label (travel km, arrival window, on-call
          // tag). Day-grid bands don't get this because they paint a
          // whole-cell background; here a label inside is useful.
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

        const classes = [theme.event];
        if (startsBefore) classes.push('ec-event-continues-from');
        if (endsAfter) classes.push('ec-event-continues-to');
        const globalCls = options.eventClassNames;
        if (typeof globalCls === 'function') {
          const c = globalCls({ event });
          if (c) classes.push(...(Array.isArray(c) ? c : [c]));
        } else if (globalCls) {
          classes.push(...(Array.isArray(globalCls) ? globalCls : [globalCls]));
        }
        if (event.classNames) classes.push(...(Array.isArray(event.classNames) ? event.classNames : [event.classNames]));
        // Phase C5/C6 auto-classes.
        classes.push(...eventMetaClassNames(event));
        const chip = createElement('div', classes.filter(Boolean).join(' '), '', [
          ['data-event-id', event.id],
          ['data-event-start', event.start.toISOString()],
          ['data-event-end',   event.end.toISOString()],
          ...eventMetaDataAttrs(event),
        ]);
        const lane = laneByEvent.get(event) ?? 0;
        chip.style.position = 'absolute';
        chip.style.top = `${startMin * pxPerMin}px`;
        const chipHeightPx = Math.max((endMin - startMin) * pxPerMin, 12);
        chip.style.height = `${chipHeightPx}px`;
        // Below ~36px the chip can't fit both the title and the time row
        // without clipping; drop the time and keep the title legible.
        if (chipHeightPx < 36) chip.classList.add('ec-event-compact');
        chip.style.left = lane === 0 ? '0' : `${lane * LANE_OFFSET_PX}px`;
        chip.style.right = '0';
        if (lane > 0) chip.style.zIndex = String(lane + 1);
        if (event.backgroundColor) chip.style.setProperty('--ec-event-color', event.backgroundColor);
        const titleEl = createElement('div', theme.eventTitle);
        if (event.extendedProps?.rrule) titleEl.append(buildRecurringBadge());
        titleEl.append(document.createTextNode(event.title || ''));
        chip.append(titleEl);
        const timeEl = createElement('div', theme.eventTime ?? 'ec-event-time');
        timeEl.innerHTML = CLOCK_ICON_SVG;
        timeEl.append(document.createTextNode(formatEventTimeRange(visStart, visEnd, options)));
        chip.append(timeEl);
        // Resize handle (bottom edge). Surfaces only when the user has
        // opted in via options.editable (and eventDurationEditable hasn't
        // been turned off). The Interaction plugin's pointerdown handler
        // picks up [.ec-resizer] and runs the resize gesture.
        //
        // For multi-day timed events the end-resizer only renders on the
        // segment that owns the event's actual end (the last segment —
        // !endsAfter), and the start-resizer only on the first segment
        // (!startsBefore). Middle segments' bottom edge represents
        // midnight, not the event boundary, so a handle there would be
        // misleading.
        if (options.editable && options.eventDurationEditable !== false) {
          if (!endsAfter) {
            const resizer = createElement('div', `${theme.resizer ?? 'ec-resizer'} ec-resizer-end`, '', [
              ['data-resizer', 'end'],
            ]);
            chip.append(resizer);
          }
          if (options.eventResizableFromStart && !startsBefore) {
            const startResizer = createElement('div', `${theme.resizer ?? 'ec-resizer'} ec-resizer-start`, '', [
              ['data-resizer', 'start'],
            ]);
            chip.append(startResizer);
          }
        }
        const fire = state.get('fire');
        // Cross-view event selection: paint .ec-event-selected on any
        // chip whose data-event-id matches the persisted selection.
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
        overlay.append(chip);
      }
      col.style.position = 'relative';
      col.append(overlay);

      // Now indicator — a horizontal line at the current time, only on the
      // today column. Suppressed unless options.nowIndicator is true.
      if (options.nowIndicator) {
        // `day` is stored as the LOCAL calendar date encoded as UTC midnight
        // (createDate(new Date()) → _fromLocalDate). Computing "today" as
        // setMidnight(new Date()) would zero out UTC hours instead, which
        // lands on the wrong UTC date whenever local time is on the opposite
        // side of midnight UTC — and the indicator would never render. Run
        // the same local→UTC-encoded conversion so the compare is apples to
        // apples.
        const today = setMidnight(createDate(new Date()));
        const isToday = datesEqual(today, setMidnight(cloneDate(day)));
        if (isToday) {
          const nowLine = createElement('div', theme.nowIndicator, '', [
            ['data-now-indicator', ''],
          ]);
          const slotMinMinNow = totalSeconds(slotTimeLimits.min) / 60;
          const minutesPerSlotNow = totalSeconds(options.slotDuration) / 60;
          const pxPerMinNow = options.slotHeight / minutesPerSlotNow;
          nowLine.style.position = 'absolute';
          nowLine.style.left = '0';
          nowLine.style.right = '0';
          nowLine.style.height = '2px';
          nowLine.style.background = '#dc2626';
          nowLine.style.zIndex = '5';
          // Live tick: reposition off state.now (set every second by
          // nowAndTodayEffect) so the line slides down as wall-clock
          // minutes advance, without rebuilding the whole view. Falls
          // back to createDate(new Date()) before the first tick lands.
          //
          // state.now is a UTC-encoded local date (createDate stores
          // local wall-clock in the UTC slots so getUTCHours() returns
          // the user's wall-clock regardless of the JS engine's TZ).
          // Read via getUTCHours / getUTCMinutes — using getHours()
          // would re-apply the local offset and land the indicator at
          // wall-clock ± offset (e.g. 9:45 am → 7:45 pm in AEST).
          const reposition = (nowDate) => {
            const n = nowDate instanceof Date ? nowDate : createDate(new Date());
            const nowMin = n.getUTCHours() * 60 + n.getUTCMinutes() - slotMinMinNow;
            nowLine.style.top = `${nowMin * pxPerMinNow}px`;
          };
          reposition(state.get('now'));
          col.append(nowLine);
          nowTickUnsub = state.on('change:now', ({ value }) => reposition(value));
        }
      }

      colsWrap.append(col);
    }
    body.append(colsWrap);

    root.append(body);
    container.replaceChildren(root);

    // Initial scroll position. Preserved across re-renders; on first
    // mount we center "now" vertically if today is in the visible
    // range (matches iOS Calendar / macOS Calendar / Google Calendar
    // when you first open a TimeGrid view). Falls back to
    // options.scrollTime when today isn't in view, or when the
    // current time is outside the slot range.
    const slotMinMin = totalSeconds(slotTimeLimits.min) / 60;
    const slotMaxMin = totalSeconds(slotTimeLimits.max) / 60;
    const minutesPerSlot = totalSeconds(options.slotDuration) / 60;
    const pxPerMin = options.slotHeight / minutesPerSlot;
    if (savedScrollTop != null) {
      body.scrollTop = savedScrollTop;
    } else {
      const now = new Date();
      const todayMid = setMidnight(new Date());
      const todayInView = days.some((d) => datesEqual(todayMid, setMidnight(cloneDate(d))));
      const nowMin = now.getHours() * 60 + now.getMinutes();
      if (todayInView && nowMin >= slotMinMin && nowMin <= slotMaxMin) {
        const nowY = (nowMin - slotMinMin) * pxPerMin;
        const viewH = body.clientHeight || 0;
        body.scrollTop = Math.max(0, nowY - viewH / 2);
        savedScrollTop = body.scrollTop;
      } else if (options.scrollTime) {
        const scrollMin = totalSeconds(options.scrollTime) / 60;
        const top = (scrollMin - slotMinMin) * pxPerMin;
        body.scrollTop = Math.max(0, top);
        savedScrollTop = body.scrollTop;
      }
    }
  };

  render();
  const off = state.onAny(({ key }) => {
    // `today` triggers a full re-render at midnight so the indicator can
    // hop columns (week view) or disappear (week ended). The minute-by-
    // minute tick lives on state.now and is handled inside render() via
    // a targeted style.top update — re-rendering the world every second
    // would be wasteful.
    if (['options', 'currentRange', 'activeRange', 'viewDates', 'filteredEvents', 'today'].includes(key)) {
      render();
    }
  });

  return () => {
    off();
    if (nowTickUnsub) { nowTickUnsub(); nowTickUnsub = null; }
    container.replaceChildren();
  };
}

function eventsOnDay(events, day) {
  const next = cloneDate(day);
  addDay(next);
  return events.filter((e) => e.start < next && e.end > day);
}

function minsSinceMidnight(date) {
  return date.getUTCHours() * 60 + date.getUTCMinutes();
}

function totalSeconds(duration) {
  return duration.days * 86400 + duration.seconds;
}

function computePeriodicity(slotLabelInterval, slotDuration) {
  if (!slotLabelInterval) return 1;
  return Math.max(1, Math.round(
    totalSeconds(slotLabelInterval) / totalSeconds(slotDuration),
  ));
}

// Apple-iCal-style compact range: "3 – 5:30PM" (shared period collapses),
// or a single time when start == end. Falls back to the configured
// eventTimeFormat for the per-part rendering so users can still override
// hour/minute/period style via options.
export function formatEventTimeRange(start, end, options) {
  const fmt = options?.eventTimeFormat || { hour: 'numeric', minute: '2-digit' };
  // timeZone:'UTC' so chip times match the slot gutter — every internal
  // Date is a UTC-encoded local wall-clock, so formatting without
  // timeZone:'UTC' would silently apply the browser's local offset and
  // print e.g. "10–11 pm" for a noon slot in Sydney.
  const intl = new Intl.DateTimeFormat(options?.locale, { timeZone: 'UTC', ...fmt });
  if (!end || start.getTime() === end.getTime()) return intl.format(start);
  const startParts = intl.formatToParts(start);
  const endParts = intl.formatToParts(end);
  const startPeriod = startParts.find((p) => p.type === 'dayPeriod')?.value;
  const endPeriod   = endParts.find((p) => p.type === 'dayPeriod')?.value;
  const startNoMin = start.getMinutes() === 0;
  const endNoMin   = end.getMinutes() === 0;
  const renderSide = (parts, dropPeriod, dropMinutes) => parts
    .filter((p) => !(dropPeriod && p.type === 'dayPeriod'))
    .filter((p) => !(dropPeriod && p.type === 'literal' && p.value.trim() === '' && p === parts[parts.length - 1]))
    .filter((p, i, arr) => {
      if (!dropMinutes) return true;
      // Drop the ":mm" tail when minutes == 0 — keep the bare hour.
      if (p.type === 'minute') return false;
      if (p.type === 'literal' && p.value === ':') return false;
      return true;
    })
    .map((p) => p.value).join('');
  const samePeriod = startPeriod && endPeriod && startPeriod === endPeriod;
  const left  = renderSide(startParts, samePeriod, startNoMin);
  const right = renderSide(endParts,   false,      endNoMin);
  return `${left.trim()} – ${right.trim()}`;
}

// Width/height/fill/stroke are SVG presentation attributes — they apply
// even when the .ec-time-grid .ec-event .ec-event-time .ec-clock-icon CSS
// cascade doesn't match (notably when the chip is cloned into the drag
// ghost and re-parented to <body>). CSS still wins when it matches, so
// the live chip's styling is unaffected; without these attributes the
// detached ghost falls back to the SVG default 300×150 size and the
// <circle>'s default black fill — a giant black disc dead-centre on
// the dragged event. See interaction.js:attachEventDragHandler.
const CLOCK_ICON_SVG = `<svg class="ec-clock-icon" viewBox="0 0 12 12" width="11" height="11" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><circle cx="6" cy="6" r="4.5"/><path d="M6 3.5 V6 L7.7 7" stroke-linecap="round"/></svg>`;
