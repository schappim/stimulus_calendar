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

describe('view: list*', () => {
  beforeEach(() => { document.body.innerHTML = ''; });
  afterEach(() => { app?.stop(); app = null; document.body.innerHTML = ''; });

  it('listWeek renders a day-header + event row per event', async () => {
    const el = await mount(`<div data-controller="calendar"
      data-calendar-plugins-value='["List"]'
      data-calendar-view-value="listWeek"
      data-calendar-date-value="2026-05-25"></div>`);
    el.calendarApi.addEvent({ id: '1', title: 'Standup', start: '2026-05-25T09:00', end: '2026-05-25T09:30' });
    el.calendarApi.addEvent({ id: '2', title: '1:1',     start: '2026-05-27T11:00', end: '2026-05-27T11:30' });
    const headers = el.querySelectorAll('[data-row="day-header"]');
    expect(headers.length).toBe(2);
    expect(el.querySelectorAll('[data-event-id]').length).toBe(2);
  });

  it('listDay renders one day; out-of-range events ignored', async () => {
    const el = await mount(`<div data-controller="calendar"
      data-calendar-plugins-value='["List"]'
      data-calendar-view-value="listDay"
      data-calendar-date-value="2026-05-25"></div>`);
    el.calendarApi.addEvent({ id: '1', title: 'In',  start: '2026-05-25T09:00', end: '2026-05-25T09:30' });
    el.calendarApi.addEvent({ id: '2', title: 'Out', start: '2026-05-26T09:00', end: '2026-05-26T09:30' });
    expect(el.querySelectorAll('[data-event-id]').length).toBe(1);
  });

  it('noEventsContent renders when there are no events', async () => {
    const el = await mount(`<div data-controller="calendar"
      data-calendar-plugins-value='["List"]'
      data-calendar-view-value="listWeek"
      data-calendar-date-value="2026-05-25"></div>`);
    expect(el.querySelector('.ec-no-events').textContent).toBe('No events');
  });

  it('noEventsClick is invoked when the empty-state is clicked', async () => {
    const el = await mount(`<div data-controller="calendar"
      data-calendar-plugins-value='["List"]'
      data-calendar-view-value="listWeek"
      data-calendar-date-value="2026-05-25"></div>`);
    let fired = 0;
    el.calendarApi.setOption('noEventsClick', () => fired++);
    el.querySelector('.ec-no-events').click();
    expect(fired).toBe(1);
  });
});
