// TimeGrid renderer — sidebar with time-slot labels + N day columns + a
// slot grid. Each day column has an absolute-positioned overlay where
// events are placed by their start/end times. Phase 6 ships the skeleton
// + slot rendering; subsequent commits add allDay, options, now indicator.

import { createElement } from '../lib/dom.js';
import { cloneDate, addDay, setMidnight, datesEqual, toISOString, addDuration } from '../lib/date.js';
import { createSlots, createSlotTimeLimits } from '../lib/slots.js';
import { viewDates as viewDatesHelper } from '../lib/derived.js';

export function renderTimeGridView(container, state) {
  // Persist user-scrolled vertical offset across re-renders so that
  // mutations triggered by editing an event (updateEvent during resize /
  // drag) don't snap the body scroll back to options.scrollTime.
  let savedScrollTop = null;
  const render = () => {
    const options = state.get('options');
    const theme = options.theme;
    const activeRange = state.get('activeRange');
    if (!activeRange) return;
    // Capture the previous body's scrollTop before we tear down its DOM.
    const prevBody = container.querySelector('[data-row="body"]');
    if (prevBody) savedScrollTop = prevBody.scrollTop;

    const days = viewDatesHelper(activeRange, options.hiddenDays ?? []);

    const root = createElement('div', `${theme.grid} ec-time-grid`, '', [
      ['data-grid', 'time-grid'],
    ]);

    // Day-of-week header row (with leading spacer aligned to sidebar).
    const header = createElement('div', `${theme.colHead}`, '', [
      ['data-row', 'header'],
    ]);
    header.append(createElement('div', `${theme.sidebar} ec-corner`));
    const headerFmt = new Intl.DateTimeFormat(options.locale, { timeZone: 'UTC', ...options.dayHeaderFormat });
    for (const d of days) {
      const head = createElement('div', theme.dayHead, headerFmt.format(d), [
        ['data-day', String(d.getUTCDay())],
      ]);
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

    // Body: sidebar + per-day columns.
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
        } else if (hours === 0) {
          cell.append(createElement('span', 'ec-slot-hour', 'Midnight'));
        } else {
          const h12 = (hours % 12) || 12;
          const period = hours >= 12 ? 'pm' : 'am';
          cell.append(createElement('span', 'ec-slot-hour', String(h12)));
          cell.append(createElement('span', 'ec-slot-period', period));
        }
      }
      sidebar.append(cell);
    }
    body.append(sidebar);

    // Day columns.
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
      for (const event of dayEvents) {
        // Clamp the event window to THIS day so the chip's top/height
        // reflect the portion of the event that lives on this column —
        // not the raw event.start which might be hours past midnight on
        // a previous day. Without clamping, a Mon 11pm → Tue 11am event
        // showed as a 12px sliver near 11pm on BOTH columns instead of
        // 11pm-midnight on Monday and midnight-11am on Tuesday.
        const dayMid = setMidnight(cloneDate(day));
        const nextDayMid = cloneDate(dayMid); addDay(nextDayMid);
        const startsBefore = event.start < dayMid;
        const endsAfter = event.end > nextDayMid;
        const visStart = startsBefore ? dayMid : event.start;
        const visEnd = endsAfter ? nextDayMid : event.end;

        const classes = [theme.event];
        if (startsBefore) classes.push('ec-event-continues-from');
        if (endsAfter) classes.push('ec-event-continues-to');
        const chip = createElement('div', classes.filter(Boolean).join(' '), '', [
          ['data-event-id', event.id],
          ['data-event-start', event.start.toISOString()],
          ['data-event-end',   event.end.toISOString()],
        ]);
        const minutesPerSlot = (totalSeconds(options.slotDuration) / 60);
        const slotMinMin = totalSeconds(slotTimeLimits.min) / 60;
        const startMin = ((visStart.getTime() - dayMid.getTime()) / 60_000) - slotMinMin;
        const endMin = ((visEnd.getTime() - dayMid.getTime()) / 60_000) - slotMinMin;
        const pxPerMin = options.slotHeight / minutesPerSlot;
        chip.style.position = 'absolute';
        chip.style.top = `${startMin * pxPerMin}px`;
        chip.style.height = `${Math.max((endMin - startMin) * pxPerMin, 12)}px`;
        chip.style.left = '0';
        chip.style.right = '0';
        if (event.backgroundColor) chip.style.backgroundColor = event.backgroundColor;
        chip.append(createElement('div', theme.eventTitle, event.title || ''));
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
        const now = new Date();
        const today = setMidnight(new Date());
        const isToday = datesEqual(today, setMidnight(cloneDate(day)));
        if (isToday) {
          const nowLine = createElement('div', theme.nowIndicator, '', [
            ['data-now-indicator', ''],
          ]);
          const slotMinMinNow = totalSeconds(slotTimeLimits.min) / 60;
          const minutesPerSlotNow = totalSeconds(options.slotDuration) / 60;
          const pxPerMinNow = options.slotHeight / minutesPerSlotNow;
          const nowMin = now.getHours() * 60 + now.getMinutes() - slotMinMinNow;
          nowLine.style.position = 'absolute';
          nowLine.style.left = '0';
          nowLine.style.right = '0';
          nowLine.style.top = `${nowMin * pxPerMinNow}px`;
          nowLine.style.height = '2px';
          nowLine.style.background = '#dc2626';
          nowLine.style.zIndex = '5';
          col.append(nowLine);
        }
      }

      colsWrap.append(col);
    }
    body.append(colsWrap);

    root.append(body);
    container.replaceChildren(root);

    // Preserve user scroll across re-renders; only apply scrollTime on
    // the first mount (when savedScrollTop is null).
    if (savedScrollTop != null) {
      body.scrollTop = savedScrollTop;
    } else if (options.scrollTime) {
      const scrollMin = totalSeconds(options.scrollTime) / 60;
      const slotMinMin = totalSeconds(slotTimeLimits.min) / 60;
      const minutesPerSlot = totalSeconds(options.slotDuration) / 60;
      const pxPerMin = options.slotHeight / minutesPerSlot;
      const top = (scrollMin - slotMinMin) * pxPerMin;
      body.scrollTop = Math.max(0, top);
      savedScrollTop = body.scrollTop;
    }
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
