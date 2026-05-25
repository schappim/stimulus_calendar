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
});
