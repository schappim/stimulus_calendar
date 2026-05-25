// @vitest-environment happy-dom
// Events-surface options exercised through the DayGrid view (most of these
// options are renderer-agnostic; testing once here covers the surface).

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Application } from '@hotwired/stimulus';
import CalendarController from '../src/controllers/calendar_controller.js';

let app;
async function mount(html) {
  document.body.innerHTML = html;
  app = Application.start();
  app.register('calendar', CalendarController);
  await new Promise((r) => queueMicrotask(r));
  await new Promise((r) => queueMicrotask(r));
  return document.querySelector('[data-controller~="calendar"]');
}

describe('events surface', () => {
  beforeEach(() => { document.body.innerHTML = ''; });
  afterEach(() => { app?.stop(); app = null; document.body.innerHTML = ''; });

  it('eventColor — default background when per-event color is absent', async () => {
    const el = await mount(`<div data-controller="calendar"
      data-calendar-plugins-value='["DayGrid"]'
      data-calendar-view-value="dayGridMonth"
      data-calendar-date-value="2026-05-15"></div>`);
    el.calendarApi.setOption('eventColor', '#10b981');
    el.calendarApi.addEvent({ id:'1', start:'2026-05-15T09:00', end:'2026-05-15T10:00' });
    const chip = el.querySelector('[data-event-id="1"]');
    expect(chip.style.backgroundColor.toLowerCase()).toMatch(/#10b981|rgb\(16, 185, 129\)/);
  });

  it('eventClassNames — global classes added to every event', async () => {
    const el = await mount(`<div data-controller="calendar"
      data-calendar-plugins-value='["DayGrid"]'
      data-calendar-view-value="dayGridMonth"
      data-calendar-date-value="2026-05-15"></div>`);
    el.calendarApi.setOption('eventClassNames', 'my-class');
    el.calendarApi.addEvent({ id:'1', start:'2026-05-15T09:00', end:'2026-05-15T10:00' });
    expect(el.querySelector('[data-event-id="1"]').classList.contains('my-class')).toBe(true);
  });

  it('eventContent — custom renderer replaces chip body', async () => {
    const el = await mount(`<div data-controller="calendar"
      data-calendar-plugins-value='["DayGrid"]'
      data-calendar-view-value="dayGridMonth"
      data-calendar-date-value="2026-05-15"></div>`);
    el.calendarApi.setOption('eventContent', ({ event }) => `★ ${event.title}`);
    el.calendarApi.addEvent({ id:'1', title:'Standup', start:'2026-05-15T09:00', end:'2026-05-15T09:30' });
    expect(el.querySelector('[data-event-id="1"]').textContent).toBe('★ Standup');
  });

  it('eventClick — handler fires on event click', async () => {
    const el = await mount(`<div data-controller="calendar"
      data-calendar-plugins-value='["DayGrid"]'
      data-calendar-view-value="dayGridMonth"
      data-calendar-date-value="2026-05-15"></div>`);
    const click = vi.fn();
    el.calendarApi.setOption('eventClick', click);
    el.calendarApi.addEvent({ id:'1', start:'2026-05-15T09:00', end:'2026-05-15T10:00' });
    el.querySelector('[data-event-id="1"]').click();
    expect(click).toHaveBeenCalledOnce();
    expect(click.mock.calls[0][0].event.id).toBe('1');
  });

  it('eventDidMount fires after event is in the DOM', async () => {
    const el = await mount(`<div data-controller="calendar"
      data-calendar-plugins-value='["DayGrid"]'
      data-calendar-view-value="dayGridMonth"
      data-calendar-date-value="2026-05-15"></div>`);
    const didMount = vi.fn();
    el.calendarApi.setOption('eventDidMount', didMount);
    el.calendarApi.addEvent({ id:'1', start:'2026-05-15T09:00', end:'2026-05-15T10:00' });
    await new Promise((r) => queueMicrotask(r));
    expect(didMount).toHaveBeenCalled();
    expect(didMount.mock.calls[0][0].el).toBeTruthy();
  });

  it('background events render with theme.bgEvent and not as chips', async () => {
    const el = await mount(`<div data-controller="calendar"
      data-calendar-plugins-value='["DayGrid"]'
      data-calendar-view-value="dayGridMonth"
      data-calendar-date-value="2026-05-15"></div>`);
    el.calendarApi.addEvent({
      id:'bg', display:'background',
      start:'2026-05-15T00:00', end:'2026-05-16T00:00',
      backgroundColor:'#fef3c7',
    });
    const bg = el.querySelector('.ec-bg-event[data-event-id="bg"]');
    expect(bg).toBeTruthy();
    expect(bg.style.backgroundColor.toLowerCase()).toMatch(/#fef3c7|rgb\(254, 243, 199\)/);
  });
});
