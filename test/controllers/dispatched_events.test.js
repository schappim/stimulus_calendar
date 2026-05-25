// @vitest-environment happy-dom
//
// Coverage for the calendar:<name> CustomEvents the README documents.
// Listeners should be able to subscribe to either form (user callback
// option OR DOM event); these tests assert the DOM event side.

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Application } from '@hotwired/stimulus';
import CalendarController from '../../src/controllers/calendar_controller.js';

let app;
function mount(html) {
  document.body.innerHTML = html;
  app = Application.start();
  app.register('calendar', CalendarController);
  return document.querySelector('[data-controller~="calendar"]');
}

const tick = (n = 1) => Promise.all(Array.from({ length: n }, () => new Promise((r) => setTimeout(r, 0))));

describe('CalendarController dispatched CustomEvents', () => {
  beforeEach(() => { document.body.innerHTML = ''; });
  afterEach(() => { app?.stop(); app = null; });

  it('calendar:ready fires with the API on detail', async () => {
    const onReady = vi.fn();
    document.body.addEventListener('calendar:ready', onReady);
    const el = mount('<div data-controller="calendar"></div>');
    await tick();
    expect(onReady).toHaveBeenCalled();
    expect(onReady.mock.calls[0][0].detail.api).toBe(el.calendarApi);
  });

  it('calendar:datesSet fires on mount and on navigation', async () => {
    const onDatesSet = vi.fn();
    document.body.addEventListener('calendar:datesSet', onDatesSet);
    const el = mount(`<div data-controller="calendar"
                            data-calendar-options-value='{"date":"2026-05-25","duration":{"weeks":1}}'></div>`);
    await tick();
    expect(onDatesSet).toHaveBeenCalled();
    // The active range covers the week containing 2026-05-25 (Mon); with
    // firstDay=0 (Sun) the range starts at 2026-05-24.
    expect(onDatesSet.mock.calls[0][0].detail.startStr).toMatch(/2026-05-2[34]/);
    onDatesSet.mockClear();
    el.calendarApi.next();
    await tick();
    expect(onDatesSet).toHaveBeenCalled();
  });

  it('calendar:viewDidMount fires after view renders', async () => {
    const onViewDidMount = vi.fn();
    document.body.addEventListener('calendar:viewDidMount', onViewDidMount);
    mount(`<div data-controller="calendar"
                data-calendar-plugins-value='["DayGrid"]'></div>`);
    await tick(3);
    expect(onViewDidMount).toHaveBeenCalled();
    expect(onViewDidMount.mock.calls[0][0].detail.view.type).toBe('dayGridMonth');
  });

  it('calendar:eventClick fires from a day-grid chip', async () => {
    const onClick = vi.fn();
    document.body.addEventListener('calendar:eventClick', onClick);
    const el = mount(`<div data-controller="calendar"
                            data-calendar-plugins-value='["DayGrid"]'
                            data-calendar-date-value="2026-05-15"></div>`);
    await tick();
    el.calendarApi.addEvent({ id: 'c1', title: 'X', start: '2026-05-15T09:00', end: '2026-05-15T10:00' });
    await tick();
    const chip = el.querySelector('[data-event-id="c1"]');
    expect(chip).toBeTruthy();
    chip.click();
    expect(onClick).toHaveBeenCalled();
    expect(onClick.mock.calls[0][0].detail.event.id).toBe('c1');
  });

  it('calendar:dateClick fires from a day-grid cell', async () => {
    const onDateClick = vi.fn();
    document.body.addEventListener('calendar:dateClick', onDateClick);
    const el = mount(`<div data-controller="calendar"
                            data-calendar-plugins-value='["DayGrid","Interaction"]'
                            data-calendar-date-value="2026-05-15"></div>`);
    await tick(2);
    const cell = el.querySelector('[data-date="2026-05-15"]');
    expect(cell).toBeTruthy();
    cell.click();
    expect(onDateClick).toHaveBeenCalled();
    expect(onDateClick.mock.calls[0][0].detail.dateStr).toBe('2026-05-15');
  });

  it('calendar:eventAllUpdated fires after batched event mutations', async () => {
    const onAllUpdated = vi.fn();
    document.body.addEventListener('calendar:eventAllUpdated', onAllUpdated);
    const el = mount(`<div data-controller="calendar"
                            data-calendar-plugins-value='["DayGrid"]'></div>`);
    await tick();
    el.calendarApi.addEvent({ id: 'a', title: 'A', start: '2026-05-25T09:00', end: '2026-05-25T10:00' });
    el.calendarApi.addEvent({ id: 'b', title: 'B', start: '2026-05-25T11:00', end: '2026-05-25T12:00' });
    await tick(3);
    expect(onAllUpdated).toHaveBeenCalled();
  });
});
