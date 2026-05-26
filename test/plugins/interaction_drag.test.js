// @vitest-environment happy-dom
//
// Coverage for the Interaction plugin's event-drag pipeline:
//  1. pointerdown on a chip primes the drag,
//  2. pointermove past eventDragMinDistance fires eventDragStart,
//  3. pointerup over a different [data-date] cell fires eventDrop and
//     commits the change via updateEvent (state.events reflects new times),
//  4. options.revert() inside eventDrop suppresses the commit.

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

function fireTouch(target, type, touches, changedTouches = touches) {
  const ev = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(ev, 'touches', { value: touches });
  Object.defineProperty(ev, 'changedTouches', { value: changedTouches });
  target.dispatchEvent(ev);
  return ev;
}

describe('Interaction plugin — event drag', () => {
  beforeEach(() => { document.body.innerHTML = ''; });
  afterEach(() => { app?.stop(); app = null; });

  it('drag from one day to the next fires eventDrop and updates state', async () => {
    const onDrop = vi.fn();
    const el = mount(`<div data-controller="calendar"
                            data-calendar-plugins-value='["DayGrid","Interaction"]'
                            data-calendar-date-value="2026-05-15"
                            data-calendar-options-value='{"editable":true}'></div>`);
    await tick(2);
    el.calendarApi.setOption('eventDrop', onDrop);
    el.calendarApi.addEvent({ id: 'm1', title: 'Move me', start: '2026-05-15T09:00', end: '2026-05-15T10:00' });
    await tick();

    const chip   = el.querySelector('[data-event-id="m1"]');
    const source = el.querySelector('[data-date="2026-05-15"]');
    const target = el.querySelector('[data-date="2026-05-16"]');
    expect(chip && source && target).toBeTruthy();

    // Stub elementsFromPoint to return the target cell on pointerup.
    document.elementsFromPoint = () => [target];

    fireOn(chip, 'pointerdown',  { clientX: 100, clientY: 100 });
    fireOn(document, 'pointermove', { clientX: 200, clientY: 200 });
    fireOn(document, 'pointerup',   { clientX: 300, clientY: 300 });

    expect(onDrop).toHaveBeenCalled();
    const detail = onDrop.mock.calls[0][0];
    expect(detail.delta.days).toBe(1);

    // State should reflect the +1 day shift.
    const moved = el.calendarApi.getEventById('m1');
    expect(moved.start.toISOString().substring(0, 10)).toBe('2026-05-16');
  });

  it('options.revert() inside eventDrop suppresses the commit', async () => {
    const el = mount(`<div data-controller="calendar"
                            data-calendar-plugins-value='["DayGrid","Interaction"]'
                            data-calendar-date-value="2026-05-15"
                            data-calendar-options-value='{"editable":true}'></div>`);
    await tick(2);
    el.calendarApi.setOption('eventDrop', (detail) => detail.revert());
    el.calendarApi.addEvent({ id: 'r1', title: 'Stays put', start: '2026-05-15T09:00', end: '2026-05-15T10:00' });
    await tick();

    const chip   = el.querySelector('[data-event-id="r1"]');
    const target = el.querySelector('[data-date="2026-05-17"]');
    document.elementsFromPoint = () => [target];

    fireOn(chip, 'pointerdown',  { clientX: 100, clientY: 100 });
    fireOn(document, 'pointermove', { clientX: 200, clientY: 200 });
    fireOn(document, 'pointerup',   { clientX: 300, clientY: 300 });

    const original = el.calendarApi.getEventById('r1');
    expect(original.start.toISOString().substring(0, 10)).toBe('2026-05-15');
  });

  it('a click without exceeding eventDragMinDistance does NOT fire eventDrop', async () => {
    const onDrop = vi.fn();
    const el = mount(`<div data-controller="calendar"
                            data-calendar-plugins-value='["DayGrid","Interaction"]'
                            data-calendar-date-value="2026-05-15"
                            data-calendar-options-value='{"editable":true}'></div>`);
    await tick(2);
    el.calendarApi.setOption('eventDrop', onDrop);
    el.calendarApi.addEvent({ id: 'c1', title: 'Click', start: '2026-05-15T09:00', end: '2026-05-15T10:00' });
    await tick();

    const chip = el.querySelector('[data-event-id="c1"]');
    fireOn(chip, 'pointerdown',  { clientX: 100, clientY: 100 });
    fireOn(document, 'pointermove', { clientX: 102, clientY: 102 }); // < 5 px
    fireOn(document, 'pointerup',   { clientX: 102, clientY: 102 });

    expect(onDrop).not.toHaveBeenCalled();
  });

  it('touch starting on an event chip does not start an event drag', async () => {
    const onDragStart = vi.fn();
    const onDrop = vi.fn();
    const el = mount(`<div data-controller="calendar"
                            data-calendar-plugins-value='["TimeGrid","Interaction"]'
                            data-calendar-date-value="2026-05-15"
                            data-calendar-options-value='{"editable":true}'></div>`);
    await tick(2);
    el.calendarApi.setOption('eventDragStart', onDragStart);
    el.calendarApi.setOption('eventDrop', onDrop);
    el.calendarApi.addEvent({ id: 'touch1', title: 'Scroll over me', start: '2026-05-15T09:00', end: '2026-05-15T10:00' });
    await tick();

    const chip = el.querySelector('[data-event-id="touch1"]');
    fireOn(chip, 'pointerdown', { pointerType: 'touch', clientX: 100, clientY: 100 });
    fireOn(document, 'pointermove', { pointerType: 'touch', clientX: 102, clientY: 220 });
    fireOn(document, 'pointerup',   { pointerType: 'touch', clientX: 102, clientY: 220 });

    expect(onDragStart).not.toHaveBeenCalled();
    expect(onDrop).not.toHaveBeenCalled();
    expect(el.calendarApi.getEventById('touch1').start.toISOString().substring(0, 16)).toBe('2026-05-15T09:00');
  });

  it('touch dragging an event chip in edit mode moves it', async () => {
    const onDrop = vi.fn();
    const el = mount(`<div data-controller="calendar"
                            data-calendar-plugins-value='["TimeGrid","Interaction"]'
                            data-calendar-date-value="2026-05-15"
                            data-calendar-options-value='{"editable":true}'></div>`);
    await tick(2);
    el.calendarApi.setOption('eventDrop', onDrop);
    el.calendarApi.addEvent({ id: 'touch-edit', title: 'Move me', start: '2026-05-15T09:00', end: '2026-05-15T10:00' });
    await tick();

    const chip = el.querySelector('[data-event-id="touch-edit"]');
    const col = el.querySelector('.ec-time-col[data-date="2026-05-15"]');
    chip.classList.add('ec-event-editing');
    col.getBoundingClientRect = () => ({ top: 100, left: 0, bottom: 1000, right: 200, width: 200, height: 900 });
    document.elementsFromPoint = () => [col];

    fireOn(chip, 'pointerdown', { pointerType: 'touch', clientX: 50, clientY: 200 });
    fireOn(document, 'pointermove', { pointerType: 'touch', clientX: 50, clientY: 222 });
    fireOn(document, 'pointerup',   { pointerType: 'touch', clientX: 50, clientY: 222 });

    expect(onDrop).toHaveBeenCalled();
    const moved = el.calendarApi.getEventById('touch-edit');
    expect(moved.start.toISOString().substring(11, 16)).toBe('09:30');
    expect(moved.end.toISOString().substring(11, 16)).toBe('10:30');
  });

  it('a touch that enters edit mode after pointerdown can immediately move the event', async () => {
    const onDrop = vi.fn();
    const el = mount(`<div data-controller="calendar"
                            data-calendar-plugins-value='["TimeGrid","Interaction"]'
                            data-calendar-date-value="2026-05-15"
                            data-calendar-options-value='{"editable":true}'></div>`);
    await tick(2);
    el.calendarApi.setOption('eventDrop', onDrop);
    el.calendarApi.addEvent({ id: 'touch-longpress', title: 'Lift then move', start: '2026-05-15T09:00', end: '2026-05-15T10:00' });
    await tick();

    const chip = el.querySelector('[data-event-id="touch-longpress"]');
    const col = el.querySelector('.ec-time-col[data-date="2026-05-15"]');
    col.getBoundingClientRect = () => ({ top: 100, left: 0, bottom: 1000, right: 200, width: 200, height: 900 });
    document.elementsFromPoint = () => [col];

    fireOn(chip, 'pointerdown', { pointerType: 'touch', clientX: 50, clientY: 200 });
    chip.classList.add('ec-event-editing');
    fireOn(document, 'pointermove', { pointerType: 'touch', clientX: 50, clientY: 222 });
    fireOn(document, 'pointerup',   { pointerType: 'touch', clientX: 50, clientY: 222 });

    expect(onDrop).toHaveBeenCalled();
    const moved = el.calendarApi.getEventById('touch-longpress');
    expect(moved.start.toISOString().substring(11, 16)).toBe('09:30');
    expect(moved.end.toISOString().substring(11, 16)).toBe('10:30');
  });

  it('touch long-press enters edit mode and locks scroll before drag threshold', async () => {
    const el = mount(`<div data-controller="calendar"
                            data-calendar-plugins-value='["TimeGrid","Interaction"]'
                            data-calendar-date-value="2026-05-15"
                            data-calendar-options-value='{"editable":true}'></div>`);
    await tick(2);
    el.calendarApi.addEvent({ id: 'touch-core-longpress', title: 'Hold me', start: '2026-05-15T09:00', end: '2026-05-15T10:00' });
    await tick();

    const chip = el.querySelector('[data-event-id="touch-core-longpress"]');
    vi.useFakeTimers();
    try {
      fireOn(chip, 'pointerdown', { pointerType: 'touch', clientX: 50, clientY: 200 });
      vi.advanceTimersByTime(241);

      expect(chip.classList.contains('ec-event-editing')).toBe(true);
      const move = fireTouch(document, 'touchmove', [{ identifier: 1, clientX: 51, clientY: 202 }]);
      expect(move.defaultPrevented).toBe(true);

      fireTouch(document, 'touchend', [], [{ identifier: 1, clientX: 51, clientY: 202 }]);
    } finally {
      vi.useRealTimers();
    }
  });

  it('edit-mode touch drag survives Android pointercancel and commits on touchend', async () => {
    const onDrop = vi.fn();
    const el = mount(`<div data-controller="calendar"
                            data-calendar-plugins-value='["TimeGrid","Interaction"]'
                            data-calendar-date-value="2026-05-15"
                            data-calendar-options-value='{"editable":true}'></div>`);
    await tick(2);
    el.calendarApi.setOption('eventDrop', onDrop);
    el.calendarApi.addEvent({ id: 'touch-cancel', title: 'Cancel then commit', start: '2026-05-15T09:00', end: '2026-05-15T10:00' });
    await tick();

    const chip = el.querySelector('[data-event-id="touch-cancel"]');
    const col = el.querySelector('.ec-time-col[data-date="2026-05-15"]');
    col.getBoundingClientRect = () => ({ top: 100, left: 0, bottom: 1000, right: 200, width: 200, height: 900 });
    document.elementsFromPoint = () => [col];

    fireOn(chip, 'pointerdown', { pointerType: 'touch', clientX: 50, clientY: 200 });
    chip.classList.add('ec-event-editing');
    fireOn(document, 'pointermove', { pointerType: 'touch', clientX: 50, clientY: 222 });
    fireTouch(document, 'touchmove', [{ identifier: 1, clientX: 50, clientY: 222 }]);
    fireOn(document, 'pointercancel', { pointerType: 'touch', clientX: 0, clientY: 0 });
    fireTouch(document, 'touchmove', [{ identifier: 1, clientX: 50, clientY: 244 }]);
    fireTouch(document, 'touchend', [], [{ identifier: 1, clientX: 50, clientY: 244 }]);

    expect(onDrop).toHaveBeenCalled();
    const moved = el.calendarApi.getEventById('touch-cancel');
    expect(moved.start.toISOString().substring(11, 16)).toBe('10:00');
    expect(moved.end.toISOString().substring(11, 16)).toBe('11:00');
  });
});
