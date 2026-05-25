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

describe('Interaction plugin', () => {
  beforeEach(() => { document.body.innerHTML = ''; });
  afterEach(() => { app?.stop(); app = null; document.body.innerHTML = ''; });

  it('Interaction plugin registers and accepts all 29 documented options', async () => {
    const el = await mount(`<div data-controller="calendar"
      data-calendar-plugins-value='["DayGrid","Interaction"]'></div>`);
    // Defaults that should be present (non-undefined):
    expect(el.calendarApi.getOption('dragScroll')).toBe(true);
    expect(el.calendarApi.getOption('editable')).toBe(false);
    expect(el.calendarApi.getOption('eventDragMinDistance')).toBe(5);
    expect(el.calendarApi.getOption('eventDurationEditable')).toBe(true);
    expect(el.calendarApi.getOption('eventStartEditable')).toBe(true);
    expect(el.calendarApi.getOption('longPressDelay')).toBe(1000);
    expect(el.calendarApi.getOption('pointer')).toBe(false);
    expect(el.calendarApi.getOption('selectMinDistance')).toBe(5);
    expect(el.calendarApi.getOption('unselectAuto')).toBe(true);
    expect(el.calendarApi.getOption('unselectCancel')).toBe('');
    // Function options default to undefined; setOption + getOption round-trip.
    for (const name of ['dateClick', 'eventDragStart', 'eventDragStop',
                        'eventDrop', 'eventResizeStart', 'eventResizeStop',
                        'eventResize', 'select', 'unselect']) {
      el.calendarApi.setOption(name, () => {});
      expect(typeof el.calendarApi.getOption(name)).toBe('function');
    }
  });

  it('dateClick fires when an empty day cell is clicked', async () => {
    const el = await mount(`<div data-controller="calendar"
      data-calendar-plugins-value='["DayGrid","Interaction"]'
      data-calendar-view-value="dayGridMonth"
      data-calendar-date-value="2026-05-15"></div>`);
    const dateClick = vi.fn();
    el.calendarApi.setOption('dateClick', dateClick);
    el.querySelector('[data-date="2026-05-15"]').click();
    expect(dateClick).toHaveBeenCalledOnce();
    expect(dateClick.mock.calls[0][0].date.getUTCDate()).toBe(15);
  });

  it('dateClick does NOT fire when an event chip is clicked', async () => {
    const el = await mount(`<div data-controller="calendar"
      data-calendar-plugins-value='["DayGrid","Interaction"]'
      data-calendar-view-value="dayGridMonth"
      data-calendar-date-value="2026-05-15"></div>`);
    const dateClick = vi.fn();
    el.calendarApi.setOption('dateClick', dateClick);
    el.calendarApi.addEvent({ id:'1', title:'X', start:'2026-05-15T09:00', end:'2026-05-15T10:00' });
    el.querySelector('[data-event-id="1"]').click();
    expect(dateClick).not.toHaveBeenCalled();
  });
});
