// @vitest-environment happy-dom
//
// Phase F — range-select pipeline. selectable: true wires it on;
// pointerdown on an empty [data-date] + pointermove past
// selectMinDistance + pointerup fires `select` with { start, end }
// and stores state.selection so api.unselect clears it.

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

function fireOn(target, type, init = {}) {
  const ev = new PointerEvent(type, Object.assign({ bubbles: true, cancelable: true, pointerId: 1, button: 0 }, init));
  target.dispatchEvent(ev);
}

describe('Phase F — range select', () => {
  beforeEach(() => { document.body.innerHTML = ''; });
  afterEach(() => { app?.stop(); app = null; });

  it('fires select with start/end after a pointer drag across day cells', async () => {
    const el = mount(`<div data-controller="calendar"
      data-calendar-plugins-value='["DayGrid","Interaction"]'
      data-calendar-view-value="dayGridMonth"
      data-calendar-date-value="2026-05-15"
      data-calendar-options-value='{"selectable":true}'></div>`);
    await tick(2);
    const onSelect = vi.fn();
    el.calendarApi.setOption('select', onSelect);

    const src = el.querySelector('[data-date="2026-05-12"]');
    const dst = el.querySelector('[data-date="2026-05-15"]');
    expect(src && dst).toBeTruthy();

    document.elementsFromPoint = () => [src];
    fireOn(src, 'pointerdown', { clientX: 100, clientY: 100 });

    document.elementsFromPoint = () => [dst];
    fireOn(document, 'pointermove', { clientX: 200, clientY: 100 });
    fireOn(document, 'pointerup',   { clientX: 200, clientY: 100 });

    expect(onSelect).toHaveBeenCalled();
    const detail = onSelect.mock.calls[0][0];
    expect(detail.start.toISOString().substring(0, 10)).toBe('2026-05-12');
    expect(detail.end.toISOString().substring(0, 10)).toBe('2026-05-16'); // end exclusive
    expect(detail.allDay).toBe(true);
  });

  it('api.unselect clears the highlight and fires unselect', async () => {
    const el = mount(`<div data-controller="calendar"
      data-calendar-plugins-value='["DayGrid","Interaction"]'
      data-calendar-view-value="dayGridMonth"
      data-calendar-date-value="2026-05-15"
      data-calendar-options-value='{"selectable":true}'></div>`);
    await tick(2);
    const onUnselect = vi.fn();
    el.calendarApi.setOption('unselect', onUnselect);
    const src = el.querySelector('[data-date="2026-05-12"]');
    const dst = el.querySelector('[data-date="2026-05-13"]');
    document.elementsFromPoint = () => [src];
    fireOn(src, 'pointerdown', { clientX: 100, clientY: 100 });
    document.elementsFromPoint = () => [dst];
    fireOn(document, 'pointermove', { clientX: 140, clientY: 100 });
    fireOn(document, 'pointerup',   { clientX: 140, clientY: 100 });
    expect(el.querySelector('.ec-select-highlight')).toBeTruthy();
    el.calendarApi.unselect({});
    expect(el.querySelector('.ec-select-highlight')).toBeNull();
    expect(onUnselect).toHaveBeenCalled();
  });
});
