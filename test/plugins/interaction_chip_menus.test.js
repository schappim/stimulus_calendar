// @vitest-environment happy-dom
//
// Coverage for OS-level long-press menu / native drag suppression on
// event chips. The calendar's own long-press path enters edit mode;
// the platform's contextual menu and HTML5 drag-lift preview would
// shadow that, so we swallow contextmenu + dragstart for any element
// inside the calendar root that resolves to a chip.

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
const tick = (n = 1) =>
  Promise.all(Array.from({ length: n }, () => new Promise((r) => setTimeout(r, 0))));

describe('Interaction — chip long-press menu / native drag suppression', () => {
  beforeEach(() => { document.body.innerHTML = ''; });
  afterEach(() => { app?.stop(); app = null; vi.restoreAllMocks(); });

  it('prevents the native contextmenu on an event chip', async () => {
    const el = mount(`<div data-controller="calendar"
                            data-calendar-plugins-value='["TimeGrid","Interaction"]'
                            data-calendar-view-value="timeGridDay"
                            data-calendar-date-value="2026-05-25"></div>`);
    await tick(2);
    el.calendarApi.addEvent({ id: 'cm1', title: 'No menu', start: '2026-05-25T09:00', end: '2026-05-25T10:00' });
    await tick();

    const chip = el.querySelector('[data-event-id="cm1"]');
    const ev = new Event('contextmenu', { bubbles: true, cancelable: true });
    chip.dispatchEvent(ev);
    expect(ev.defaultPrevented).toBe(true);
  });

  it('prevents native HTML5 dragstart on an event chip (iOS drag-lift / desktop ghost)', async () => {
    const el = mount(`<div data-controller="calendar"
                            data-calendar-plugins-value='["TimeGrid","Interaction"]'
                            data-calendar-view-value="timeGridDay"
                            data-calendar-date-value="2026-05-25"></div>`);
    await tick(2);
    el.calendarApi.addEvent({ id: 'd1', title: 'No drag-lift', start: '2026-05-25T09:00', end: '2026-05-25T10:00' });
    await tick();

    const chip = el.querySelector('[data-event-id="d1"]');
    const ev = new Event('dragstart', { bubbles: true, cancelable: true });
    chip.dispatchEvent(ev);
    expect(ev.defaultPrevented).toBe(true);
  });

  it('does not block contextmenu outside event chips (e.g. host-app right-click on the gutter)', async () => {
    const el = mount(`<div data-controller="calendar"
                            data-calendar-plugins-value='["TimeGrid","Interaction"]'
                            data-calendar-view-value="timeGridDay"
                            data-calendar-date-value="2026-05-25"></div>`);
    await tick(2);

    // An empty time-col cell — no [data-event-id] ancestor.
    const col = el.querySelector('.ec-time-col[data-date="2026-05-25"]');
    const ev = new Event('contextmenu', { bubbles: true, cancelable: true });
    col.dispatchEvent(ev);
    expect(ev.defaultPrevented).toBe(false);
  });
});
