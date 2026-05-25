// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
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

describe('view: dayGridMonth', () => {
  beforeEach(() => { document.body.innerHTML = ''; });
  afterEach(() => { app?.stop(); app = null; document.body.innerHTML = ''; });

  it('renders a 7-column day grid for May 2026 with weekday headers', async () => {
    const el = await mount(`<div data-controller="calendar"
      data-calendar-plugins-value='["DayGrid"]'
      data-calendar-view-value="dayGridMonth"
      data-calendar-date-value="2026-05-15"></div>`);
    const grid = el.querySelector('[data-grid="day-grid"]');
    expect(grid).toBeTruthy();
    const headers = grid.querySelector('[data-row="header"]');
    expect(headers.children.length).toBe(7);
    // Day rows should be present (at least one row of day cells).
    const dayRows = grid.querySelectorAll('[data-row="days"]');
    expect(dayRows.length).toBeGreaterThan(0);
    // Total cell count across the grid should be a multiple of 7 (full weeks).
    let totalCells = 0;
    dayRows.forEach((r) => (totalCells += r.children.length));
    expect(totalCells % 7).toBe(0);
  });

  it('marks today with the theme.today class', async () => {
    const el = await mount(`<div data-controller="calendar"
      data-calendar-plugins-value='["DayGrid"]'></div>`);
    const today = new Date().toISOString().substring(0, 10);
    const cell = el.querySelector(`[data-date="${today}"]`);
    expect(cell).toBeTruthy();
    expect(cell.classList.contains('ec-today')).toBe(true);
  });

  it('marks other-month days with the theme.otherMonth class', async () => {
    const el = await mount(`<div data-controller="calendar"
      data-calendar-plugins-value='["DayGrid"]'
      data-calendar-view-value="dayGridMonth"
      data-calendar-date-value="2026-05-15"></div>`);
    // May 1 2026 is a Friday; the grid starts on Sunday April 26.
    const april26 = el.querySelector('[data-date="2026-04-26"]');
    expect(april26).toBeTruthy();
    expect(april26.classList.contains('ec-other-month')).toBe(true);
  });
});
