// @vitest-environment happy-dom
//
// Verifies the touch-only gesture gate on dateClick (S10):
//
//   - Mouse / pen clicks on a cell always fire dateClick.
//   - Touch taps with no preceding scroll / swipe fire dateClick.
//   - Touch clicks AFTER the time-grid body scrolled (the user's
//     vertical-scroll gesture ended in a lift-off click) are
//     suppressed.
//   - Touch clicks while the pager is mid-swipe (.ec-pager-dragging
//     present) are suppressed.

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

function firePointer(target, type, init = {}) {
  const ev = new PointerEvent(type, Object.assign({ bubbles: true, cancelable: true, pointerId: 1, button: 0 }, init));
  target.dispatchEvent(ev);
}

function fireClick(target, init = {}) {
  const ev = new MouseEvent('click', Object.assign({ bubbles: true, cancelable: true, button: 0 }, init));
  target.dispatchEvent(ev);
}

describe('dateClick — touch-aware gesture gate', () => {
  beforeEach(() => { document.body.innerHTML = ''; });
  afterEach(() => { app?.stop(); app = null; document.body.innerHTML = ''; });

  it('mouse click on a cell fires dateClick (control)', async () => {
    const onDateClick = vi.fn();
    const el = await mount(`<div data-controller="calendar"
      data-calendar-plugins-value='["DayGrid","Interaction"]'
      data-calendar-date-value="2026-05-15"></div>`);
    el.calendarApi.setOption('dateClick', onDateClick);
    const cell = el.querySelector('[data-date="2026-05-20"]');
    expect(cell).toBeTruthy();

    firePointer(cell, 'pointerdown', { pointerType: 'mouse', clientX: 100, clientY: 100 });
    firePointer(cell, 'pointerup',   { pointerType: 'mouse', clientX: 100, clientY: 100 });
    fireClick(cell);

    expect(onDateClick).toHaveBeenCalledTimes(1);
  });

  it('touch tap on a cell with no preceding scroll/swipe fires dateClick', async () => {
    const onDateClick = vi.fn();
    const el = await mount(`<div data-controller="calendar"
      data-calendar-plugins-value='["DayGrid","Interaction"]'
      data-calendar-date-value="2026-05-15"></div>`);
    el.calendarApi.setOption('dateClick', onDateClick);
    const cell = el.querySelector('[data-date="2026-05-20"]');

    firePointer(cell, 'pointerdown', { pointerType: 'touch', clientX: 100, clientY: 100 });
    firePointer(cell, 'pointerup',   { pointerType: 'touch', clientX: 100, clientY: 100 });
    fireClick(cell);

    expect(onDateClick).toHaveBeenCalledTimes(1);
  });

  it('touch click that lands AFTER the time-grid body scrolled is suppressed', async () => {
    const onDateClick = vi.fn();
    const el = await mount(`<div data-controller="calendar"
      data-calendar-plugins-value='["TimeGrid","Interaction"]'
      data-calendar-view-value="timeGridDay"
      data-calendar-date-value="2026-05-15"></div>`);
    el.calendarApi.setOption('dateClick', onDateClick);
    // happy-dom doesn't lay out the grid with scroll content, so we
    // stub the body's scrollTop directly to simulate a scroll gesture
    // between pointerdown and click.
    const body = el.querySelector('.ec-time-grid [data-row="body"]');
    expect(body).toBeTruthy();
    Object.defineProperty(body, 'scrollTop', {
      configurable: true,
      get() { return body.__scrollTop ?? 0; },
      set(v) { body.__scrollTop = v; },
    });
    body.__scrollTop = 0;
    const cell = el.querySelector('.ec-time-col[data-date="2026-05-15"]');

    // pointerdown @ scrollTop=0
    firePointer(cell, 'pointerdown', { pointerType: 'touch', clientX: 100, clientY: 200 });
    // user scrolled the body 80 px between down and up
    body.__scrollTop = 80;
    firePointer(cell, 'pointerup',   { pointerType: 'touch', clientX: 100, clientY: 280 });
    fireClick(cell);

    expect(onDateClick).not.toHaveBeenCalled();
  });

  it('touch click while pager is mid-swipe (.ec-pager-dragging) is suppressed', async () => {
    const onDateClick = vi.fn();
    const el = await mount(`<div data-controller="calendar"
      data-calendar-plugins-value='["DayGrid","Interaction"]'
      data-calendar-date-value="2026-05-15"></div>`);
    el.calendarApi.setOption('dateClick', onDateClick);
    const cell = el.querySelector('[data-date="2026-05-20"]');
    expect(cell).toBeTruthy();
    // Inject a stub pager carrying both classes inside the calendar's
    // internal root (this._root, the host's first child) so the gate's
    // `.ec-pager.ec-pager-dragging` selector finds it. We avoid
    // poking the real pager because its own pointer handlers reset
    // the dragging class during the synthetic gestures below.
    const internalRoot = el.firstElementChild;
    const stub = document.createElement('div');
    stub.className = 'ec-pager ec-pager-dragging';
    internalRoot.appendChild(stub);

    firePointer(cell, 'pointerdown', { pointerType: 'touch', clientX: 100, clientY: 100 });
    firePointer(cell, 'pointerup',   { pointerType: 'touch', clientX: 100, clientY: 100 });
    fireClick(cell);

    expect(onDateClick).not.toHaveBeenCalled();
  });

  it('mouse click after a body scroll still fires dateClick (gate is touch-only)', async () => {
    const onDateClick = vi.fn();
    const el = await mount(`<div data-controller="calendar"
      data-calendar-plugins-value='["TimeGrid","Interaction"]'
      data-calendar-view-value="timeGridDay"
      data-calendar-date-value="2026-05-15"></div>`);
    el.calendarApi.setOption('dateClick', onDateClick);
    const body = el.querySelector('.ec-time-grid [data-row="body"]');
    Object.defineProperty(body, 'scrollTop', {
      configurable: true,
      get() { return body.__scrollTop ?? 0; },
      set(v) { body.__scrollTop = v; },
    });
    body.__scrollTop = 0;
    const cell = el.querySelector('.ec-time-col[data-date="2026-05-15"]');

    firePointer(cell, 'pointerdown', { pointerType: 'mouse', clientX: 100, clientY: 200 });
    body.__scrollTop = 80;
    firePointer(cell, 'pointerup',   { pointerType: 'mouse', clientX: 100, clientY: 280 });
    fireClick(cell);

    expect(onDateClick).toHaveBeenCalledTimes(1);
  });
});
