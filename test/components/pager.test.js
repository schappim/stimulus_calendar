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
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
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

function fireTouch(target, type, touches, changedTouches = touches) {
  const ev = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(ev, 'touches', { value: touches });
  Object.defineProperty(ev, 'changedTouches', { value: changedTouches });
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

  it('a rightward touch pointercancel uses the last move position and goes back', async () => {
    const el = mount(`<div data-controller="calendar"
                            data-calendar-plugins-value='["DayGrid"]'
                            data-calendar-date-value="2026-05-15"
                            data-calendar-options-value='{"duration":{"weeks":1}}'></div>`);
    await tick();
    const pager = el.querySelector('.ec-pager');
    Object.defineProperty(pager, 'offsetWidth', { configurable: true, value: 600 });

    fire(pager, 'pointerdown', { pointerType: 'touch', clientX: 100, clientY: 200 });
    fire(document, 'pointermove', { pointerType: 'touch', clientX: 320, clientY: 200 });
    fire(document, 'pointercancel', { pointerType: 'touch', clientX: 0, clientY: 0 });

    await new Promise((r) => setTimeout(r, 280));
    const date = el.calendarApi.getOption('date');
    expect(date.toISOString().substring(0, 10)).toBe('2026-05-08');
  });

  it('a rightward touch pointerup with zero coordinates still goes back', async () => {
    const el = mount(`<div data-controller="calendar"
                            data-calendar-plugins-value='["DayGrid"]'
                            data-calendar-date-value="2026-05-15"
                            data-calendar-options-value='{"duration":{"weeks":1}}'></div>`);
    await tick();
    const pager = el.querySelector('.ec-pager');
    Object.defineProperty(pager, 'offsetWidth', { configurable: true, value: 600 });

    fire(pager, 'pointerdown', { pointerType: 'touch', clientX: 100, clientY: 200 });
    fire(document, 'pointermove', { pointerType: 'touch', clientX: 320, clientY: 200 });
    fire(document, 'pointerup', { pointerType: 'touch', clientX: 0, clientY: 0 });

    await new Promise((r) => setTimeout(r, 280));
    const date = el.calendarApi.getOption('date');
    expect(date.toISOString().substring(0, 10)).toBe('2026-05-08');
  });

  it('touch-event fallback supports left and right swipe navigation', async () => {
    const el = mount(`<div data-controller="calendar"
                            data-calendar-plugins-value='["DayGrid"]'
                            data-calendar-date-value="2026-05-15"
                            data-calendar-options-value='{"duration":{"weeks":1}}'></div>`);
    await tick();
    const pager = el.querySelector('.ec-pager');
    Object.defineProperty(pager, 'offsetWidth', { configurable: true, value: 600 });

    fireTouch(pager, 'touchstart', [{ identifier: 1, clientX: 500, clientY: 200 }]);
    fireTouch(document, 'touchmove', [{ identifier: 1, clientX: 200, clientY: 200 }]);
    fireTouch(document, 'touchend', [], [{ identifier: 1, clientX: 200, clientY: 200 }]);
    await new Promise((r) => setTimeout(r, 280));
    expect(el.calendarApi.getOption('date').toISOString().substring(0, 10)).toBe('2026-05-22');

    fireTouch(pager, 'touchstart', [{ identifier: 2, clientX: 100, clientY: 200 }]);
    fireTouch(document, 'touchmove', [{ identifier: 2, clientX: 400, clientY: 200 }]);
    fireTouch(document, 'touchend', [], [{ identifier: 2, clientX: 400, clientY: 200 }]);
    await new Promise((r) => setTimeout(r, 280));
    expect(el.calendarApi.getOption('date').toISOString().substring(0, 10)).toBe('2026-05-15');
  });

  it('touch swipes can start on event chips, while vertical chip gestures are left to scrolling', async () => {
    const el = mount(`<div data-controller="calendar"
                            data-calendar-plugins-value='["DayGrid"]'
                            data-calendar-date-value="2026-05-15"
                            data-calendar-options-value='{"duration":{"weeks":1}}'></div>`);
    await tick();
    const pager = el.querySelector('.ec-pager');
    Object.defineProperty(pager, 'offsetWidth', { configurable: true, value: 600 });
    el.calendarApi.addEvent({ id: 'chip-swipe', title: 'Swipe over me', start: '2026-05-15T09:00', end: '2026-05-15T10:00' });
    await tick();
    const chip = el.querySelector('[data-event-id="chip-swipe"]');

    fireTouch(chip, 'touchstart', [{ identifier: 1, clientX: 250, clientY: 100 }]);
    const move = fireTouch(document, 'touchmove', [{ identifier: 1, clientX: 252, clientY: 260 }]);
    fireTouch(document, 'touchend', [], [{ identifier: 1, clientX: 252, clientY: 260 }]);
    await new Promise((r) => setTimeout(r, 280));
    expect(move.defaultPrevented).toBe(false);
    expect(el.calendarApi.getOption('date').toISOString().substring(0, 10)).toBe('2026-05-15');

    fireTouch(chip, 'touchstart', [{ identifier: 2, clientX: 500, clientY: 200 }]);
    fireTouch(document, 'touchmove', [{ identifier: 2, clientX: 200, clientY: 200 }]);
    fireTouch(document, 'touchend', [], [{ identifier: 2, clientX: 200, clientY: 200 }]);
    await new Promise((r) => setTimeout(r, 280));
    expect(el.calendarApi.getOption('date').toISOString().substring(0, 10)).toBe('2026-05-22');
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

  // Mobile host shells routinely drop the outer grid border (see
  // demo/18-mobile.html: `.ec-grid.ec-time-grid { border: 0 }`). In a
  // single-day view that leaves the trailing day-name header with no
  // visible right edge, so the live header and the appearing
  // neighbour's header blend together during a swipe. The library's
  // CSS reinstates the 1px column separator while the gesture is in
  // flight; this test pins both halves down: the .ec-pager-dragging
  // class lands on the pager during a horizontal pointer drag, AND
  // the stylesheet ships the matching rule that hangs a right border
  // on the trailing day-head while that class is present.
  it('day-name header keeps its right border during a swipe (single-day view, no outer grid border)', async () => {
    const el = mount(`<div data-controller="calendar"
                            data-calendar-plugins-value='["TimeGrid"]'
                            data-calendar-view-value="timeGridDay"
                            data-calendar-date-value="2026-05-15"></div>`);
    await tick();
    const pager = el.querySelector('.ec-pager');
    Object.defineProperty(pager, 'offsetWidth', { configurable: true, value: 600 });
    const dayHead = el.querySelector('.ec-time-grid .ec-day-head');
    expect(dayHead).toBeTruthy();
    // Confirm the trailing-header bug surface still exists: in a
    // single-day TimeGrid view the only day-head IS :last-child,
    // which the base CSS strips of its right border.
    expect(dayHead.matches('.ec-time-grid .ec-day-head:last-child')).toBe(true);

    // Begin a horizontal drag — large enough to "decide" the gesture
    // and flip the pager into its dragging state, small enough not
    // to commit a navigation.
    fire(pager, 'pointerdown', { clientX: 400, clientY: 200 });
    fire(document, 'pointermove', { clientX: 360, clientY: 200 }); // dx=-40, decides
    expect(pager.classList.contains('ec-pager-dragging')).toBe(true);
    fire(document, 'pointerup', { clientX: 360, clientY: 200 });
    await new Promise((r) => setTimeout(r, 280));

    // Pin the CSS contract: the library ships a rule that targets
    // both the time-grid AND day-grid trailing day-head while the
    // pager is dragging, restoring the 1px right border so the live
    // and snapshot headers don't blur into one strip in shells that
    // drop the outer grid border.
    const cssPath = resolve(process.cwd(), 'src/styles/calendar.css');
    const css = readFileSync(cssPath, 'utf8');
    expect(css).toMatch(/\.ec-pager\.ec-pager-dragging\s+\.ec-time-grid\s+\.ec-day-head:last-child[\s\S]*?\.ec-pager\.ec-pager-dragging\s+\.ec-day-grid\s+\.ec-day-head:last-child[\s\S]*?border-right:\s*1px\s+solid\s+var\(--ec-border-color\)/);
  });
});
