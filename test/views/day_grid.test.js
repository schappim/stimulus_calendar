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

  it('dayCellFormat renders a day-number inside each cell', async () => {
    const el = await mount(`<div data-controller="calendar"
      data-calendar-plugins-value='["DayGrid"]'
      data-calendar-view-value="dayGridMonth"
      data-calendar-date-value="2026-05-15"></div>`);
    const cell = el.querySelector('[data-date="2026-05-15"]');
    const num = cell.querySelector('.ec-day-number');
    expect(num).toBeTruthy();
    expect(num.textContent).toBe('15');
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

  it('renders events inside day cells as chips with time + title', async () => {
    const el = await mount(`<div data-controller="calendar"
      data-calendar-plugins-value='["DayGrid"]'
      data-calendar-view-value="dayGridMonth"
      data-calendar-date-value="2026-05-15"></div>`);
    el.calendarApi.addEvent({
      id: '1', title: 'Standup',
      start: '2026-05-15T09:00', end: '2026-05-15T09:30',
    });
    const cell = el.querySelector('[data-date="2026-05-15"]');
    const chip = cell.querySelector('[data-event-id="1"]');
    expect(chip).toBeTruthy();
    expect(chip.textContent).toContain('Standup');
  });

  it('passes extendedProps.dataAttrs through to data-* attributes on the chip', async () => {
    const el = await mount(`<div data-controller="calendar"
      data-calendar-plugins-value='["DayGrid"]'
      data-calendar-view-value="dayGridMonth"
      data-calendar-date-value="2026-05-15"></div>`);
    el.calendarApi.addEvent({
      id: 'appt-42',
      title: 'Switchboard upgrade',
      start: '2026-05-15T09:00',
      end: '2026-05-15T11:00',
      extendedProps: {
        dataAttrs: {
          aiContextType: 'job',
          jobId: 1042,
          pinned: true,
        },
      },
    });
    const chip = el.querySelector('[data-event-id="appt-42"]');
    expect(chip.getAttribute('data-ai-context-type')).toBe('job');
    expect(chip.getAttribute('data-job-id')).toBe('1042');
    expect(chip.getAttribute('data-pinned')).toBe('true');
  });

  it('dayCellContent (function) replaces the day-number body', async () => {
    const el = await mount(`<div data-controller="calendar"
      data-calendar-plugins-value='["DayGrid"]'
      data-calendar-view-value="dayGridMonth"
      data-calendar-date-value="2026-05-15"></div>`);
    el.calendarApi.setOption('dayCellContent', ({ date }) => `★${date.getUTCDate()}`);
    const cell = el.querySelector('[data-date="2026-05-15"] .ec-day-number');
    expect(cell.textContent).toBe('★15');
  });

  it('dayMaxEvents (via setOption) collapses overflow to a +N more link', async () => {
    const el = await mount(`<div data-controller="calendar"
      data-calendar-plugins-value='["DayGrid"]'
      data-calendar-view-value="dayGridMonth"
      data-calendar-date-value="2026-05-15"></div>`);
    el.calendarApi.setOption('dayMaxEvents', 2);
    for (let i = 0; i < 5; ++i) {
      el.calendarApi.addEvent({
        id: `e${i}`, title: `E${i}`,
        start: '2026-05-15T09:00', end: '2026-05-15T09:30',
      });
    }
    const cell = el.querySelector('[data-date="2026-05-15"]');
    expect(cell.querySelectorAll('[data-event-id]').length).toBe(2);
    const more = cell.querySelector('[data-more-link]');
    expect(more).toBeTruthy();
    expect(more.textContent).toBe('+3 more');
  });

  it('moreLinkContent overrides the +N more label', async () => {
    const el = await mount(`<div data-controller="calendar"
      data-calendar-plugins-value='["DayGrid"]'
      data-calendar-view-value="dayGridMonth"
      data-calendar-date-value="2026-05-15"></div>`);
    el.calendarApi.setOption('dayMaxEvents', 1);
    el.calendarApi.setOption('moreLinkContent', ({ num }) => `${num} hidden`);
    el.calendarApi.addEvent({ id: 'a', start: '2026-05-15T09:00', end: '2026-05-15T09:30' });
    el.calendarApi.addEvent({ id: 'b', start: '2026-05-15T10:00', end: '2026-05-15T10:30' });
    const more = el.querySelector('[data-more-link]');
    expect(more.textContent).toBe('1 hidden');
  });

  it('weekNumbers renders a leading week-number column with default W##', async () => {
    const el = await mount(`<div data-controller="calendar"
      data-calendar-plugins-value='["DayGrid"]'
      data-calendar-view-value="dayGridMonth"
      data-calendar-date-value="2026-05-15"></div>`);
    el.calendarApi.setOption('weekNumbers', true);
    const weeks = el.querySelectorAll('[data-week]');
    expect(weeks.length).toBeGreaterThan(0);
    expect(weeks[0].textContent).toMatch(/^W\d{2}$/);
  });

  it('weekNumberContent overrides the default W## label', async () => {
    const el = await mount(`<div data-controller="calendar"
      data-calendar-plugins-value='["DayGrid"]'
      data-calendar-view-value="dayGridMonth"
      data-calendar-date-value="2026-05-15"></div>`);
    el.calendarApi.setOption('weekNumbers', true);
    el.calendarApi.setOption('weekNumberContent', ({ week }) => `#${week}`);
    const w = el.querySelector('[data-week]');
    expect(w.textContent).toMatch(/^#\d+$/);
  });

  it('clicking +N more opens a day popover listing every event', async () => {
    const el = await mount(`<div data-controller="calendar"
      data-calendar-plugins-value='["DayGrid"]'
      data-calendar-view-value="dayGridMonth"
      data-calendar-date-value="2026-05-15"></div>`);
    el.calendarApi.setOption('dayMaxEvents', 1);
    el.calendarApi.addEvent({ id: 'a', title: 'A', start: '2026-05-15T09:00', end: '2026-05-15T10:00' });
    el.calendarApi.addEvent({ id: 'b', title: 'B', start: '2026-05-15T11:00', end: '2026-05-15T12:00' });
    el.querySelector('[data-more-link]').click();
    const popup = document.querySelector('[data-popover="day"]');
    expect(popup).toBeTruthy();
    expect(popup.querySelectorAll('[data-event-id]').length).toBe(2);
  });
});
