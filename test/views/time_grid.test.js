// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Application } from '@hotwired/stimulus';
import CalendarController from '../../src/controllers/calendar_controller.js';

let app;
async function mount(html) {
  document.body.innerHTML = html;
  app = Application.start();
  app.register('calendar', CalendarController);
  await new Promise((r) => queueMicrotask(r));
  await new Promise((r) => queueMicrotask(r));
  return document.querySelector('[data-controller~="calendar"]');
}

describe('view: timeGridWeek', () => {
  beforeEach(() => { document.body.innerHTML = ''; });
  afterEach(() => { app?.stop(); app = null; document.body.innerHTML = ''; });

  it('renders a sidebar + 7 day columns + slot grid', async () => {
    const el = await mount(`<div data-controller="calendar"
      data-calendar-plugins-value='["TimeGrid"]'
      data-calendar-view-value="timeGridWeek"
      data-calendar-date-value="2026-05-25"></div>`);
    const grid = el.querySelector('[data-grid="time-grid"]');
    expect(grid).toBeTruthy();
    const sidebar = grid.querySelector('[data-row="body"] > .ec-sidebar');
    expect(sidebar).toBeTruthy();
    expect(sidebar.children.length).toBeGreaterThan(0);
    const cols = grid.querySelectorAll('.ec-time-col');
    expect(cols.length).toBe(7);
  });

  it('positions a 09:00–09:30 event at the right slot', async () => {
    const el = await mount(`<div data-controller="calendar"
      data-calendar-plugins-value='["TimeGrid"]'
      data-calendar-view-value="timeGridDay"
      data-calendar-date-value="2026-05-25"></div>`);
    el.calendarApi.addEvent({
      id: '1', title: 'Standup',
      start: '2026-05-25T09:00', end: '2026-05-25T09:30',
    });
    const chip = el.querySelector('[data-event-id="1"]');
    expect(chip).toBeTruthy();
    expect(parseFloat(chip.style.top)).toBeGreaterThan(0);
    expect(parseFloat(chip.style.height)).toBeGreaterThan(0);
  });

  it('passes extendedProps.dataAttrs through to data-* on the timeGrid chip', async () => {
    const el = await mount(`<div data-controller="calendar"
      data-calendar-plugins-value='["TimeGrid"]'
      data-calendar-view-value="timeGridDay"
      data-calendar-date-value="2026-05-25"></div>`);
    el.calendarApi.addEvent({
      id: 'appt-42',
      title: 'Switchboard upgrade',
      start: '2026-05-25T09:00',
      end: '2026-05-25T11:00',
      extendedProps: {
        dataAttrs: { aiContextType: 'appointment', jobId: 1042 },
      },
    });
    const chip = el.querySelector('[data-event-id="appt-42"]');
    expect(chip).toBeTruthy();
    expect(chip.getAttribute('data-ai-context-type')).toBe('appointment');
    expect(chip.getAttribute('data-job-id')).toBe('1042');
    // Existing data attributes (data-event-start / data-event-end) are
    // untouched by the passthrough — present alongside the new ones.
    expect(chip.getAttribute('data-event-start')).toBeTruthy();
  });

  it('renders an all-day row when allDaySlot (default), with one cell per visible day', async () => {
    const el = await mount(`<div data-controller="calendar"
      data-calendar-plugins-value='["TimeGrid"]'
      data-calendar-view-value="timeGridWeek"
      data-calendar-date-value="2026-05-25"></div>`);
    const row = el.querySelector('[data-row="all-day"]');
    expect(row).toBeTruthy();
    expect(row.querySelectorAll('.ec-all-day-cell').length).toBe(7);
  });

  it('hides the all-day row when allDaySlot is false', async () => {
    const el = await mount(`<div data-controller="calendar"
      data-calendar-plugins-value='["TimeGrid"]'
      data-calendar-view-value="timeGridWeek"
      data-calendar-date-value="2026-05-25"></div>`);
    el.calendarApi.setOption('allDaySlot', false);
    expect(el.querySelector('[data-row="all-day"]')).toBeNull();
  });

  it('allDayContent (function) overrides the all-day label', async () => {
    const el = await mount(`<div data-controller="calendar"
      data-calendar-plugins-value='["TimeGrid"]'
      data-calendar-view-value="timeGridWeek"
      data-calendar-date-value="2026-05-25"></div>`);
    el.calendarApi.setOption('allDayContent', () => 'All day');
    const label = el.querySelector('.ec-all-day-label');
    expect(label.textContent).toBe('All day');
  });

  it('nowIndicator draws a horizontal line on the today column when enabled', async () => {
    const el = await mount(`<div data-controller="calendar"
      data-calendar-plugins-value='["TimeGrid"]'
      data-calendar-view-value="timeGridDay"></div>`);
    el.calendarApi.setOption('nowIndicator', true);
    const line = el.querySelector('[data-now-indicator]');
    expect(line).toBeTruthy();
  });

  it('nowIndicator slides every second as state.now ticks (no full re-render)', async () => {
    // Pin wall-clock to 09:00 so the initial top is predictable, then
    // advance to 09:30 and let the setInterval (1s) fire once. The
    // indicator's top should jump forward, but the DOM node should be
    // the same reference — we update style.top, not rebuild the view.
    vi.useFakeTimers({ shouldAdvanceTime: false });
    vi.setSystemTime(new Date(2026, 4, 27, 9, 0, 0));
    const el = await mount(`<div data-controller="calendar"
      data-calendar-plugins-value='["TimeGrid"]'
      data-calendar-view-value="timeGridDay"></div>`);
    el.calendarApi.setOption('nowIndicator', true);
    const line0 = el.querySelector('[data-now-indicator]');
    expect(line0).toBeTruthy();
    const top0 = parseFloat(line0.style.top);

    vi.setSystemTime(new Date(2026, 4, 27, 9, 30, 0));
    vi.advanceTimersByTime(1000);

    const line1 = el.querySelector('[data-now-indicator]');
    expect(line1).toBe(line0);
    expect(parseFloat(line1.style.top)).toBeGreaterThan(top0);
    vi.useRealTimers();
  });

  it('nowIndicator top is computed from UTC slots of state.now, not local hours', async () => {
    // state.now is set by nowAndTodayEffect via createDate(undefined,
    // offset) — a Date whose UTC slots encode the LOCAL wall-clock
    // (getUTCHours() returns wall-clock regardless of the JS engine's
    // TZ). A regression that reads state.now.getHours() re-applies the
    // local-TZ offset, so on a non-UTC machine the line slides by
    // ±offset hours (the real-world bug: 9:45 am AEST → 7:45 pm).
    //
    // We inject a UTC-encoded Date directly via state.set('now', ...)
    // and assert the indicator's top corresponds to the UTC slots of
    // that Date — an assertion that is independent of whichever TZ the
    // test runner happens to be in (CI is typically UTC; dev boxes are
    // not).
    const el = await mount(`<div data-controller="calendar"
      data-calendar-plugins-value='["TimeGrid"]'
      data-calendar-view-value="timeGridDay"></div>`);
    el.calendarApi.setOption('nowIndicator', true);
    const controller = app.getControllerForElementAndIdentifier(el, 'calendar');
    expect(controller).toBeTruthy();

    // 09:45 wall-clock — synthetic UTC-encoded Date.
    controller._state.set('now', new Date(Date.UTC(2026, 4, 27, 9, 45, 0)));
    const line = el.querySelector('[data-now-indicator]');
    expect(line).toBeTruthy();
    // Defaults: slotMinTime=00:00, slotDuration=00:30, slotHeight=24
    // → pxPerMin = 24/30 = 0.8; wall-clock 9:45 = 585 min → 468px.
    expect(parseFloat(line.style.top)).toBeCloseTo(468, 0);

    // Inject a second wall-clock to be sure the read isn't accidentally
    // honest on one value and broken on another (e.g. local TZ happens
    // to equal UTC during the first assertion).
    controller._state.set('now', new Date(Date.UTC(2026, 4, 27, 14, 0, 0)));
    // 14:00 = 840 min → 672px.
    expect(parseFloat(line.style.top)).toBeCloseTo(672, 0);
  });

  it('slotEventOverlap accepted as option (full overlap layout in Phase 11)', async () => {
    const el = await mount(`<div data-controller="calendar"
      data-calendar-plugins-value='["TimeGrid"]'
      data-calendar-view-value="timeGridDay"></div>`);
    el.calendarApi.setOption('slotEventOverlap', false);
    expect(el.calendarApi.getOption('slotEventOverlap')).toBe(false);
  });

  it('all-day events render inside the all-day row, not the slot grid', async () => {
    const el = await mount(`<div data-controller="calendar"
      data-calendar-plugins-value='["TimeGrid"]'
      data-calendar-view-value="timeGridDay"
      data-calendar-date-value="2026-05-25"></div>`);
    el.calendarApi.addEvent({
      id: 'ad', title: 'Holiday', allDay: true,
      start: '2026-05-25', end: '2026-05-26',
    });
    const row = el.querySelector('[data-row="all-day"]');
    expect(row.querySelector('[data-event-id="ad"]')).toBeTruthy();
    const body = el.querySelector('[data-row="body"]');
    expect(body.querySelector('[data-event-id="ad"]')).toBeNull();
  });
});
