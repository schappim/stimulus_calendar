// @vitest-environment happy-dom
//
// Coverage for the macOS-style swipe carousel that wraps every view:
//   1. The pager DOM (track + 3 pages) is mounted around the view.
//   2. The live view renders inside .ec-pager-page-current.
//   3. A pointer drag past the snap threshold commits navigation
//      (api.next/prev called); a short drag snaps back without
//      advancing the date.
//   4. Vertical pointer drag is abandoned (calendar doesn't hijack
//      vertical scroll).
//   5. Two-finger horizontal trackpad scroll (wheel deltaX) navigates
//      past the threshold.
//   6. ArrowLeft / ArrowRight on the focused pager navigates.
//   7. Snapshots on prev/next pages render after first gesture.

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

function fire(target, type, init = {}) {
  // happy-dom supports PointerEvent.
  const ev = new PointerEvent(type, Object.assign({
    bubbles: true, cancelable: true, pointerId: 1, button: 0,
  }, init));
  target.dispatchEvent(ev);
  return ev;
}

function fireWheel(target, deltaX, deltaY = 0) {
  const ev = new WheelEvent('wheel', {
    bubbles: true, cancelable: true, deltaX, deltaY,
  });
  target.dispatchEvent(ev);
  return ev;
}

describe('Pager — swipe / wheel / keyboard navigation', () => {
  beforeEach(() => { document.body.innerHTML = ''; });
  afterEach(() => { app?.stop(); app = null; vi.restoreAllMocks(); });

  it('wraps the view in a 3-page pager track', async () => {
    const el = mount(`<div data-controller="calendar"
                            data-calendar-plugins-value='["DayGrid"]'
                            data-calendar-date-value="2026-05-15"></div>`);
    await tick();
    const pager = el.querySelector('.ec-pager');
    expect(pager).toBeTruthy();
    expect(el.querySelector('.ec-pager-track')).toBeTruthy();
    expect(el.querySelector('.ec-pager-page-prev')).toBeTruthy();
    expect(el.querySelector('.ec-pager-page-current .ec-day-grid')).toBeTruthy();
    expect(el.querySelector('.ec-pager-page-next')).toBeTruthy();
  });

  it('a long horizontal pointer drag advances the date', async () => {
    const el = mount(`<div data-controller="calendar"
                            data-calendar-plugins-value='["DayGrid"]'
                            data-calendar-date-value="2026-05-15"
                            data-calendar-options-value='{"duration":{"weeks":1}}'></div>`);
    await tick();
    const pager = el.querySelector('.ec-pager');
    // Stub offsetWidth so the threshold maths are deterministic.
    Object.defineProperty(pager, 'offsetWidth', { configurable: true, value: 600 });

    fire(pager, 'pointerdown', { clientX: 500, clientY: 200 });
    fire(document, 'pointermove', { clientX: 350, clientY: 200 }); // dx = -150 → past 25% of 600 = 150
    fire(document, 'pointermove', { clientX: 200, clientY: 200 }); // dx = -300
    fire(document, 'pointerup', { clientX: 200, clientY: 200 });

    // The pager schedules the navigation via setTimeout(SWIPE_ANIM_MS).
    await new Promise((r) => setTimeout(r, 280));
    const date = el.calendarApi.getOption('date');
    expect(date.toISOString().substring(0, 10)).toBe('2026-05-22');
  });

  it('a short drag snaps back without advancing', async () => {
    const el = mount(`<div data-controller="calendar"
                            data-calendar-plugins-value='["DayGrid"]'
                            data-calendar-date-value="2026-05-15"
                            data-calendar-options-value='{"duration":{"weeks":1}}'></div>`);
    await tick();
    const pager = el.querySelector('.ec-pager');
    Object.defineProperty(pager, 'offsetWidth', { configurable: true, value: 600 });

    fire(pager, 'pointerdown', { clientX: 500, clientY: 200 });
    fire(document, 'pointermove', { clientX: 480, clientY: 200 }); // dx = -20 (< threshold)
    fire(document, 'pointerup', { clientX: 480, clientY: 200 });
    await new Promise((r) => setTimeout(r, 280));

    const date = el.calendarApi.getOption('date');
    expect(date.toISOString().substring(0, 10)).toBe('2026-05-15');
  });

  it('mostly-vertical drag is abandoned and does not advance', async () => {
    const el = mount(`<div data-controller="calendar"
                            data-calendar-plugins-value='["DayGrid"]'
                            data-calendar-date-value="2026-05-15"
                            data-calendar-options-value='{"duration":{"weeks":1}}'></div>`);
    await tick();
    const pager = el.querySelector('.ec-pager');
    Object.defineProperty(pager, 'offsetWidth', { configurable: true, value: 600 });

    fire(pager, 'pointerdown', { clientX: 500, clientY: 200 });
    fire(document, 'pointermove', { clientX: 510, clientY: 400 }); // mostly vertical
    fire(document, 'pointermove', { clientX: 300, clientY: 400 }); // big horizontal AFTER vertical
    fire(document, 'pointerup', { clientX: 300, clientY: 400 });
    await new Promise((r) => setTimeout(r, 280));

    const date = el.calendarApi.getOption('date');
    expect(date.toISOString().substring(0, 10)).toBe('2026-05-15');
  });

  it('horizontal wheel scroll past threshold advances the date', async () => {
    const el = mount(`<div data-controller="calendar"
                            data-calendar-plugins-value='["DayGrid"]'
                            data-calendar-date-value="2026-05-15"
                            data-calendar-options-value='{"duration":{"weeks":1}}'></div>`);
    await tick();
    const pager = el.querySelector('.ec-pager');
    Object.defineProperty(pager, 'offsetWidth', { configurable: true, value: 600 });
    // Wheel threshold = min(width * 0.35, 200) = 200 for 600px.
    // Two-finger swipe LEFT on macOS gives positive deltaX → advance (next).
    fireWheel(pager, 220, 0);
    await new Promise((r) => setTimeout(r, 280));
    const date = el.calendarApi.getOption('date');
    expect(date.toISOString().substring(0, 10)).toBe('2026-05-22');
  });

  it('ArrowRight on the focused pager calls api.next', async () => {
    const el = mount(`<div data-controller="calendar"
                            data-calendar-plugins-value='["DayGrid"]'
                            data-calendar-date-value="2026-05-15"
                            data-calendar-options-value='{"duration":{"weeks":1}}'></div>`);
    await tick();
    const pager = el.querySelector('.ec-pager');
    pager.focus();
    const ev = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true });
    pager.dispatchEvent(ev);
    await new Promise((r) => setTimeout(r, 300));
    const date = el.calendarApi.getOption('date');
    expect(date.toISOString().substring(0, 10)).toBe('2026-05-22');
  });

  it('ArrowLeft on the focused pager calls api.prev', async () => {
    const el = mount(`<div data-controller="calendar"
                            data-calendar-plugins-value='["DayGrid"]'
                            data-calendar-date-value="2026-05-15"
                            data-calendar-options-value='{"duration":{"weeks":1}}'></div>`);
    await tick();
    const pager = el.querySelector('.ec-pager');
    pager.focus();
    pager.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true }));
    await new Promise((r) => setTimeout(r, 300));
    const date = el.calendarApi.getOption('date');
    expect(date.toISOString().substring(0, 10)).toBe('2026-05-08');
  });

  it('snapshots populate prev/next pages on first gesture', async () => {
    const el = mount(`<div data-controller="calendar"
                            data-calendar-plugins-value='["DayGrid"]'
                            data-calendar-date-value="2026-05-15"
                            data-calendar-options-value='{"duration":{"weeks":1}}'></div>`);
    await tick();
    const pager = el.querySelector('.ec-pager');
    Object.defineProperty(pager, 'offsetWidth', { configurable: true, value: 600 });

    // Before the gesture: snapshots empty.
    expect(el.querySelector('.ec-pager-page-prev').children.length).toBe(0);
    expect(el.querySelector('.ec-pager-page-next').children.length).toBe(0);

    fire(pager, 'pointerdown', { clientX: 500, clientY: 200 });
    fire(document, 'pointermove', { clientX: 470, clientY: 200 }); // enough to "decide" (dx=30 > 6)
    expect(el.querySelector('.ec-pager-page-prev .ec-day-grid')).toBeTruthy();
    expect(el.querySelector('.ec-pager-page-next .ec-day-grid')).toBeTruthy();
    fire(document, 'pointerup', { clientX: 470, clientY: 200 }); // short, snaps back
    await new Promise((r) => setTimeout(r, 280));
  });

  it('pointer drag that begins on an event chip is ignored by the pager', async () => {
    const el = mount(`<div data-controller="calendar"
                            data-calendar-plugins-value='["DayGrid"]'
                            data-calendar-date-value="2026-05-15"
                            data-calendar-options-value='{"duration":{"weeks":1}}'></div>`);
    await tick();
    el.calendarApi.addEvent({ id: 'sw1', title: 'Skip', start: '2026-05-15T09:00', end: '2026-05-15T10:00' });
    await tick();
    const chip = el.querySelector('[data-event-id="sw1"]');
    const pager = el.querySelector('.ec-pager');
    Object.defineProperty(pager, 'offsetWidth', { configurable: true, value: 600 });

    fire(chip, 'pointerdown', { clientX: 500, clientY: 200 });
    fire(document, 'pointermove', { clientX: 200, clientY: 200 });
    fire(document, 'pointerup', { clientX: 200, clientY: 200 });
    await new Promise((r) => setTimeout(r, 280));

    // Date unchanged — chip drag goes to interaction plugin, not pager.
    const date = el.calendarApi.getOption('date');
    expect(date.toISOString().substring(0, 10)).toBe('2026-05-15');
  });
});
