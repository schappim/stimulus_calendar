// @vitest-environment happy-dom
//
// Coverage for the per-view date memory in the calendar controller.
// Each view independently remembers the date it was last looking at;
// switching to a view restores that view's date. A simple Day → Month
// → Day round-trip preserves the day; a Day → Month → navigate-in-
// Month → Day round-trip puts the user back on the day they were
// ORIGINALLY on (not the month they ended on).

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Application } from '@hotwired/stimulus';
import CalendarController from '../../src/controllers/calendar_controller.js';

let app;
async function mount(html) {
  document.body.innerHTML = html;
  app = Application.start();
  app.register('calendar', CalendarController);
  await new Promise((r) => setTimeout(r, 0));
  await new Promise((r) => setTimeout(r, 0));
  return document.querySelector('[data-controller~="calendar"]');
}
const tick = (n = 1) =>
  Promise.all(Array.from({ length: n }, () => new Promise((r) => setTimeout(r, 0))));

describe('CalendarController — per-view date memory', () => {
  beforeEach(() => { document.body.innerHTML = ''; });
  afterEach(() => { app?.stop(); app = null; });

  it('simple Day → Month → Day round-trip keeps the day', async () => {
    const el = await mount(`<div data-controller="calendar"
      data-calendar-plugins-value='["DayGrid","TimeGrid"]'
      data-calendar-view-value="timeGridDay"
      data-calendar-date-value="2026-05-25"></div>`);

    expect(el.calendarApi.getOption('date').toISOString().substring(0, 10)).toBe('2026-05-25');

    el.calendarApi.setOption('view', 'dayGridMonth');
    await tick();
    el.calendarApi.setOption('view', 'timeGridDay');
    await tick();
    expect(el.calendarApi.getOption('date').toISOString().substring(0, 10)).toBe('2026-05-25');
  });

  it('Day → Month → navigate forward → Day restores the original day', async () => {
    const el = await mount(`<div data-controller="calendar"
      data-calendar-plugins-value='["DayGrid","TimeGrid"]'
      data-calendar-view-value="timeGridDay"
      data-calendar-date-value="2026-05-25"></div>`);

    el.calendarApi.setOption('view', 'dayGridMonth');
    await tick();
    // Pager / toolbar nav inside Month moves options.date by the month
    // duration → June 25.
    el.calendarApi.next();
    await tick();
    expect(el.calendarApi.getOption('date').toISOString().substring(0, 10)).toBe('2026-06-25');

    // Switch back to Day — should restore May 25, not June 25.
    el.calendarApi.setOption('view', 'timeGridDay');
    await tick();
    expect(el.calendarApi.getOption('date').toISOString().substring(0, 10)).toBe('2026-05-25');
  });

  it('Month remembers its own browsed month independently', async () => {
    const el = await mount(`<div data-controller="calendar"
      data-calendar-plugins-value='["DayGrid","TimeGrid"]'
      data-calendar-view-value="timeGridDay"
      data-calendar-date-value="2026-05-25"></div>`);

    el.calendarApi.setOption('view', 'dayGridMonth');
    await tick();
    el.calendarApi.next();
    await tick();
    el.calendarApi.setOption('view', 'timeGridDay');
    await tick();
    // Day pops back to May 25 — verified above; here we just go round
    // again to confirm Month restores June 25 (its last position).
    el.calendarApi.setOption('view', 'dayGridMonth');
    await tick();
    expect(el.calendarApi.getOption('date').toISOString().substring(0, 10)).toBe('2026-06-25');
  });

  it('navigating in Day view updates Day\'s memory, not Month\'s', async () => {
    const el = await mount(`<div data-controller="calendar"
      data-calendar-plugins-value='["DayGrid","TimeGrid"]'
      data-calendar-view-value="timeGridDay"
      data-calendar-date-value="2026-05-25"></div>`);

    // Page forward inside Day view → 2026-05-26.
    el.calendarApi.next();
    await tick();
    expect(el.calendarApi.getOption('date').toISOString().substring(0, 10)).toBe('2026-05-26');

    // Switch to Month — Month has no remembered date yet, so the
    // current options.date (2026-05-26) flows through.
    el.calendarApi.setOption('view', 'dayGridMonth');
    await tick();
    expect(el.calendarApi.getOption('date').toISOString().substring(0, 10)).toBe('2026-05-26');

    // Now switch back to Day → restores 2026-05-26 (Day's most recent
    // remembered position).
    el.calendarApi.setOption('view', 'timeGridDay');
    await tick();
    expect(el.calendarApi.getOption('date').toISOString().substring(0, 10)).toBe('2026-05-26');
  });

  it('gotoDate updates only the current view\'s memory', async () => {
    const el = await mount(`<div data-controller="calendar"
      data-calendar-plugins-value='["DayGrid","TimeGrid"]'
      data-calendar-view-value="timeGridDay"
      data-calendar-date-value="2026-05-25"></div>`);

    el.calendarApi.gotoDate('2026-07-04');
    await tick();
    el.calendarApi.setOption('view', 'dayGridMonth');
    await tick();
    el.calendarApi.next();   // → August
    await tick();
    el.calendarApi.setOption('view', 'timeGridDay');
    await tick();
    expect(el.calendarApi.getOption('date').toISOString().substring(0, 10)).toBe('2026-07-04');
  });
});
