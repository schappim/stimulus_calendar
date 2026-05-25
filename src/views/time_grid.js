// TimeGrid renderer — sidebar with time-slot labels + N day columns + a
// slot grid. Each day column has an absolute-positioned overlay where
// events are placed by their start/end times. Phase 6 ships the skeleton
// + slot rendering; subsequent commits add allDay, options, now indicator.

import { createElement } from '../lib/dom.js';
import { cloneDate, addDay, setMidnight, datesEqual, toISOString, addDuration } from '../lib/date.js';
import { createSlots, createSlotTimeLimits } from '../lib/slots.js';
import { viewDates as viewDatesHelper } from '../lib/derived.js';

export function renderTimeGridView(container, state) {
  const render = () => {
    const options = state.get('options');
    const theme = options.theme;
    const activeRange = state.get('activeRange');
    if (!activeRange) return;

    const days = viewDatesHelper(activeRange, options.hiddenDays ?? []);

    const root = createElement('div', `${theme.grid} ec-time-grid`, '', [
      ['data-grid', 'time-grid'],
    ]);

    // Day-of-week header row (with leading spacer aligned to sidebar).
    const header = createElement('div', `${theme.colHead}`, '', [
      ['data-row', 'header'],
    ]);
    header.append(createElement('div', `${theme.sidebar} ec-corner`));
    const headerFmt = new Intl.DateTimeFormat(options.locale, options.dayHeaderFormat);
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
      for (const day of days) {
        const cell = createElement('div', `${theme.day} ec-all-day-cell`, '', [
          ['data-date', day.toISOString().substring(0, 10)],
        ]);
        const allDayEvents = eventsOnDay(filtered, day).filter((e) => e.allDay);
        for (const event of allDayEvents) {
          const chip = createElement('div', theme.event, '', [
            ['data-event-id', event.id],
          ]);
          if (event.backgroundColor) chip.style.backgroundColor = event.backgroundColor;
          chip.append(createElement('div', theme.eventTitle, event.title || ''));
          cell.append(chip);
        }
        allDayCols.append(cell);
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
      format: (d) => new Intl.DateTimeFormat(options.locale, options.slotLabelFormat).format(d),
    };
    const slotLabelPeriodicity = computePeriodicity(options.slotLabelInterval, options.slotDuration);
    const slots = createSlots(
      activeRange.start, options.slotDuration, slotLabelPeriodicity, slotTimeLimits, slotLabelFmt,
    );

    // Sidebar — slot label column.
    const sidebar = createElement('div', theme.sidebar);
    for (const [_iso, label] of slots) {
      const cell = createElement('div', theme.slot, label);
      cell.style.height = `${options.slotHeight}px`;
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
        const chip = createElement('div', theme.event, '', [
          ['data-event-id', event.id],
        ]);
        const minutesPerSlot = (totalSeconds(options.slotDuration) / 60);
        const slotMinMin = totalSeconds(slotTimeLimits.min) / 60;
        const startMin = minsSinceMidnight(event.start) - slotMinMin;
        const endMin = minsSinceMidnight(event.end) - slotMinMin;
        const pxPerMin = options.slotHeight / minutesPerSlot;
        chip.style.position = 'absolute';
        chip.style.top = `${startMin * pxPerMin}px`;
        chip.style.height = `${Math.max((endMin - startMin) * pxPerMin, 12)}px`;
        chip.style.left = '0';
        chip.style.right = '0';
        if (event.backgroundColor) chip.style.backgroundColor = event.backgroundColor;
        chip.append(createElement('div', theme.eventTitle, event.title || ''));
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

    // Initial scroll to scrollTime.
    if (options.scrollTime) {
      const scrollMin = totalSeconds(options.scrollTime) / 60;
      const slotMinMin = totalSeconds(slotTimeLimits.min) / 60;
      const minutesPerSlot = totalSeconds(options.slotDuration) / 60;
      const pxPerMin = options.slotHeight / minutesPerSlot;
      const top = (scrollMin - slotMinMin) * pxPerMin;
      body.scrollTop = Math.max(0, top);
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
