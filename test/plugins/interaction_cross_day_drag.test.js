// @vitest-environment happy-dom
//
// Coverage for cross-day touch drag on single-day TimeGrid views
// (mobile day view). Mirrors mobile_schedule_controller.js:
//
//   - chip enters edit mode via long-press (240 ms);
//   - dragging the chip into the pager's left/right edge band arms a
//     deliberate 850 ms hold for the first day-step, then 375 ms for
//     each subsequent step while the finger stays parked;
//   - each step animates the pager track ±viewportWidth over 230 ms,
//     re-anchors the live view on the new date, and renders a
//     "+N days" / "−N days" badge on the ghost;
//   - releasing on the now-current view's column commits a multi-day
//     eventDrop whose delta covers the original-to-new-date shift,
//     even though the source column the chip was rendered in has been
//     torn down by the day-step.
//
// The pager's swipe + wheel + keyboard paths already have their own
// coverage in test/components/pager.test.js — this file only exercises
// the drag-side wiring that calls pagerApi.stepDuringDrag.

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

function firePointer(target, type, init = {}) {
  const ev = new PointerEvent(type, Object.assign({
    bubbles: true, cancelable: true, pointerId: 1, button: 0,
  }, init));
  target.dispatchEvent(ev);
  return ev;
}

describe('Interaction — cross-day touch drag (edge-hold)', () => {
  beforeEach(() => { document.body.innerHTML = ''; });
  afterEach(() => { app?.stop(); app = null; vi.restoreAllMocks(); });

  it('exposes stepDuringDrag and the pager element via state.pagerApi', async () => {
    const el = mount(`<div data-controller="calendar"
                            data-calendar-plugins-value='["TimeGrid","Interaction"]'
                            data-calendar-view-value="timeGridDay"
                            data-calendar-date-value="2026-05-25"></div>`);
    await tick(2);
    const ctrl = app.getControllerForElementAndIdentifier(el, 'calendar');
    const pagerApi = ctrl._state.get('pagerApi');
    expect(pagerApi).toBeTruthy();
    expect(typeof pagerApi.stepDuringDrag).toBe('function');
    expect(pagerApi.element).toBeTruthy();
    expect(pagerApi.element.classList.contains('ec-pager')).toBe(true);
  });

  it('pagerApi.stepDuringDrag advances the calendar by one day per call', async () => {
    const el = mount(`<div data-controller="calendar"
                            data-calendar-plugins-value='["TimeGrid","Interaction"]'
                            data-calendar-view-value="timeGridDay"
                            data-calendar-date-value="2026-05-25"></div>`);
    await tick(2);
    const ctrl = app.getControllerForElementAndIdentifier(el, 'calendar');
    const pagerApi = ctrl._state.get('pagerApi');
    Object.defineProperty(pagerApi.element, 'offsetWidth', { configurable: true, value: 390 });

    await pagerApi.stepDuringDrag(+1);
    expect(el.calendarApi.getOption('date').toISOString().substring(0, 10)).toBe('2026-05-26');
    await pagerApi.stepDuringDrag(+1);
    expect(el.calendarApi.getOption('date').toISOString().substring(0, 10)).toBe('2026-05-27');
    await pagerApi.stepDuringDrag(-1);
    expect(el.calendarApi.getOption('date').toISOString().substring(0, 10)).toBe('2026-05-26');
  });

  it('camping at the right edge fires stepDuringDrag after 850 ms hold', async () => {
    const el = mount(`<div data-controller="calendar"
                            data-calendar-plugins-value='["TimeGrid","Interaction"]'
                            data-calendar-view-value="timeGridDay"
                            data-calendar-date-value="2026-05-25"
                            data-calendar-options-value='{"editable":true}'></div>`);
    await tick(2);
    el.calendarApi.addEvent({ id: 'eh1', title: 'Hold me', start: '2026-05-25T09:00', end: '2026-05-25T10:00' });
    await tick();

    const ctrl = app.getControllerForElementAndIdentifier(el, 'calendar');
    // Swap in a mock pagerApi so the test exercises only the edge-hold
    // pipeline — not the pager's slide-and-rotate (which has its own
    // coverage in pager.test.js).
    const stepSpy = vi.fn().mockResolvedValue(undefined);
    const pagerEl = ctrl._state.get('pagerApi').element;
    pagerEl.getBoundingClientRect = () => ({
      left: 0, top: 0, right: 390, bottom: 700, width: 390, height: 700,
    });
    ctrl._state.set('pagerApi', { stepDuringDrag: stepSpy, element: pagerEl });

    const chip = el.querySelector('[data-event-id="eh1"]');
    const sourceCol = el.querySelector('.ec-time-col[data-date="2026-05-25"]');
    sourceCol.getBoundingClientRect = () => ({ top: 100, left: 0, bottom: 1000, right: 390, width: 390, height: 900 });
    document.elementsFromPoint = () => [sourceCol];
    chip.classList.add('ec-event-editing');

    vi.useFakeTimers();
    try {
      firePointer(chip, 'pointerdown', { pointerType: 'touch', clientX: 50, clientY: 200 });
      // Past dragMinDist so the ghost materialises and updateDragMove
      // takes the edit-mode branch.
      firePointer(document, 'pointermove', { pointerType: 'touch', clientX: 60, clientY: 215 });
      // Right-edge zone: width 390, max-zone 120 → clientX ≥ 270 enters.
      firePointer(document, 'pointermove', { pointerType: 'touch', clientX: 380, clientY: 215 });

      vi.advanceTimersByTime(800);
      expect(stepSpy).not.toHaveBeenCalled();

      await vi.advanceTimersByTimeAsync(100);
      expect(stepSpy).toHaveBeenCalledTimes(1);
      expect(stepSpy).toHaveBeenCalledWith(+1);

      // Subsequent steps follow at the faster 375 ms cadence.
      await vi.advanceTimersByTimeAsync(380);
      expect(stepSpy).toHaveBeenCalledTimes(2);

      // Leaving the edge zone cancels the next pending step.
      firePointer(document, 'pointermove', { pointerType: 'touch', clientX: 200, clientY: 215 });
      await vi.advanceTimersByTimeAsync(1200);
      expect(stepSpy).toHaveBeenCalledTimes(2);

      firePointer(document, 'pointerup', { pointerType: 'touch', clientX: 200, clientY: 215 });
    } finally {
      vi.useRealTimers();
    }
  });

  it('leaving the edge zone before 850 ms cancels the day step', async () => {
    const el = mount(`<div data-controller="calendar"
                            data-calendar-plugins-value='["TimeGrid","Interaction"]'
                            data-calendar-view-value="timeGridDay"
                            data-calendar-date-value="2026-05-25"
                            data-calendar-options-value='{"editable":true}'></div>`);
    await tick(2);
    el.calendarApi.addEvent({ id: 'lv1', title: 'Skim past', start: '2026-05-25T09:00', end: '2026-05-25T10:00' });
    await tick();

    const ctrl = app.getControllerForElementAndIdentifier(el, 'calendar');
    const stepSpy = vi.fn().mockResolvedValue(undefined);
    const pagerEl = ctrl._state.get('pagerApi').element;
    pagerEl.getBoundingClientRect = () => ({
      left: 0, top: 0, right: 390, bottom: 700, width: 390, height: 700,
    });
    ctrl._state.set('pagerApi', { stepDuringDrag: stepSpy, element: pagerEl });

    const chip = el.querySelector('[data-event-id="lv1"]');
    const sourceCol = el.querySelector('.ec-time-col[data-date="2026-05-25"]');
    sourceCol.getBoundingClientRect = () => ({ top: 100, left: 0, bottom: 1000, right: 390, width: 390, height: 900 });
    document.elementsFromPoint = () => [sourceCol];
    chip.classList.add('ec-event-editing');

    vi.useFakeTimers();
    try {
      firePointer(chip, 'pointerdown', { pointerType: 'touch', clientX: 50, clientY: 200 });
      firePointer(document, 'pointermove', { pointerType: 'touch', clientX: 60, clientY: 215 });
      firePointer(document, 'pointermove', { pointerType: 'touch', clientX: 380, clientY: 215 });
      vi.advanceTimersByTime(400);
      // Out of edge zone before timer fires.
      firePointer(document, 'pointermove', { pointerType: 'touch', clientX: 200, clientY: 215 });
      await vi.advanceTimersByTimeAsync(800);
      expect(stepSpy).not.toHaveBeenCalled();
      firePointer(document, 'pointerup', { pointerType: 'touch', clientX: 200, clientY: 215 });
    } finally {
      vi.useRealTimers();
    }
  });

  it('does not arm the edge-hold timer on a multi-day view (timeGridWeek)', async () => {
    const el = mount(`<div data-controller="calendar"
                            data-calendar-plugins-value='["TimeGrid","Interaction"]'
                            data-calendar-view-value="timeGridWeek"
                            data-calendar-date-value="2026-05-25"
                            data-calendar-options-value='{"editable":true,"firstDay":1}'></div>`);
    await tick(2);
    el.calendarApi.addEvent({ id: 'mv1', title: 'In a week', start: '2026-05-25T09:00', end: '2026-05-25T10:00' });
    await tick();

    const ctrl = app.getControllerForElementAndIdentifier(el, 'calendar');
    const stepSpy = vi.fn().mockResolvedValue(undefined);
    const pagerEl = ctrl._state.get('pagerApi').element;
    pagerEl.getBoundingClientRect = () => ({
      left: 0, top: 0, right: 600, bottom: 700, width: 600, height: 700,
    });
    ctrl._state.set('pagerApi', { stepDuringDrag: stepSpy, element: pagerEl });

    const chip = el.querySelector('[data-event-id="mv1"]');
    const sourceCol = el.querySelector('.ec-time-col[data-date="2026-05-25"]');
    sourceCol.getBoundingClientRect = () => ({ top: 100, left: 0, bottom: 1000, right: 80, width: 80, height: 900 });
    document.elementsFromPoint = () => [sourceCol];
    chip.classList.add('ec-event-editing');

    vi.useFakeTimers();
    try {
      firePointer(chip, 'pointerdown', { pointerType: 'touch', clientX: 40, clientY: 200 });
      firePointer(document, 'pointermove', { pointerType: 'touch', clientX: 45, clientY: 215 });
      firePointer(document, 'pointermove', { pointerType: 'touch', clientX: 580, clientY: 215 });
      await vi.advanceTimersByTimeAsync(2000);
      expect(stepSpy).not.toHaveBeenCalled();
      firePointer(document, 'pointerup', { pointerType: 'touch', clientX: 580, clientY: 215 });
    } finally {
      vi.useRealTimers();
    }
  });

  it('does not arm the edge-hold timer if the chip has not entered edit mode', async () => {
    const el = mount(`<div data-controller="calendar"
                            data-calendar-plugins-value='["TimeGrid","Interaction"]'
                            data-calendar-view-value="timeGridDay"
                            data-calendar-date-value="2026-05-25"
                            data-calendar-options-value='{"editable":true}'></div>`);
    await tick(2);
    el.calendarApi.addEvent({ id: 'ne1', title: 'No edit', start: '2026-05-25T09:00', end: '2026-05-25T10:00' });
    await tick();

    const ctrl = app.getControllerForElementAndIdentifier(el, 'calendar');
    const stepSpy = vi.fn().mockResolvedValue(undefined);
    const pagerEl = ctrl._state.get('pagerApi').element;
    pagerEl.getBoundingClientRect = () => ({
      left: 0, top: 0, right: 390, bottom: 700, width: 390, height: 700,
    });
    ctrl._state.set('pagerApi', { stepDuringDrag: stepSpy, element: pagerEl });

    const chip = el.querySelector('[data-event-id="ne1"]');
    const sourceCol = el.querySelector('.ec-time-col[data-date="2026-05-25"]');
    sourceCol.getBoundingClientRect = () => ({ top: 100, left: 0, bottom: 1000, right: 390, width: 390, height: 900 });
    document.elementsFromPoint = () => [sourceCol];
    // NOTE: no ec-event-editing class.

    vi.useFakeTimers();
    try {
      firePointer(chip, 'pointerdown', { pointerType: 'touch', clientX: 50, clientY: 200 });
      firePointer(document, 'pointermove', { pointerType: 'touch', clientX: 380, clientY: 215 });
      await vi.advanceTimersByTimeAsync(2000);
      expect(stepSpy).not.toHaveBeenCalled();
      firePointer(document, 'pointerup', { pointerType: 'touch', clientX: 380, clientY: 215 });
    } finally {
      vi.useRealTimers();
    }
  });

  it('renders a "+N days" badge on the ghost after a day step', async () => {
    const el = mount(`<div data-controller="calendar"
                            data-calendar-plugins-value='["TimeGrid","Interaction"]'
                            data-calendar-view-value="timeGridDay"
                            data-calendar-date-value="2026-05-25"
                            data-calendar-options-value='{"editable":true}'></div>`);
    await tick(2);
    el.calendarApi.addEvent({ id: 'bd1', title: 'Badge me', start: '2026-05-25T09:00', end: '2026-05-25T10:00' });
    await tick();

    const ctrl = app.getControllerForElementAndIdentifier(el, 'calendar');
    const stepSpy = vi.fn().mockResolvedValue(undefined);
    const pagerEl = ctrl._state.get('pagerApi').element;
    pagerEl.getBoundingClientRect = () => ({
      left: 0, top: 0, right: 390, bottom: 700, width: 390, height: 700,
    });
    ctrl._state.set('pagerApi', { stepDuringDrag: stepSpy, element: pagerEl });

    const chip = el.querySelector('[data-event-id="bd1"]');
    const sourceCol = el.querySelector('.ec-time-col[data-date="2026-05-25"]');
    sourceCol.getBoundingClientRect = () => ({ top: 100, left: 0, bottom: 1000, right: 390, width: 390, height: 900 });
    document.elementsFromPoint = () => [sourceCol];
    chip.classList.add('ec-event-editing');

    vi.useFakeTimers();
    try {
      firePointer(chip, 'pointerdown', { pointerType: 'touch', clientX: 50, clientY: 200 });
      firePointer(document, 'pointermove', { pointerType: 'touch', clientX: 60, clientY: 215 });
      firePointer(document, 'pointermove', { pointerType: 'touch', clientX: 380, clientY: 215 });
      await vi.advanceTimersByTimeAsync(900);
      const badge = document.body.querySelector('.ec-ghost .ec-day-offset-badge');
      expect(badge).toBeTruthy();
      expect(badge.textContent).toBe('+1 day');

      await vi.advanceTimersByTimeAsync(380);
      const badgeAfter = document.body.querySelector('.ec-ghost .ec-day-offset-badge');
      expect(badgeAfter.textContent).toBe('+2 days');

      // Moving back into the LEFT edge band switches direction; the
      // camp resets so the first reverse step requires the full
      // initial hold again.
      firePointer(document, 'pointermove', { pointerType: 'touch', clientX: 30, clientY: 215 });
      await vi.advanceTimersByTimeAsync(900);
      expect(stepSpy).toHaveBeenCalledWith(-1);
      const badgeReverse = document.body.querySelector('.ec-ghost .ec-day-offset-badge');
      expect(badgeReverse.textContent).toBe('+1 day');

      firePointer(document, 'pointerup', { pointerType: 'touch', clientX: 30, clientY: 215 });
    } finally {
      vi.useRealTimers();
    }
  });

  it('commits a multi-day delta when the drop lands on a different day than the source', async () => {
    const onDrop = vi.fn();
    const el = mount(`<div data-controller="calendar"
                            data-calendar-plugins-value='["TimeGrid","Interaction"]'
                            data-calendar-view-value="timeGridDay"
                            data-calendar-date-value="2026-05-25"
                            data-calendar-options-value='{"editable":true}'></div>`);
    await tick(2);
    el.calendarApi.setOption('eventDrop', onDrop);
    el.calendarApi.addEvent({ id: 'cd1', title: 'Cross day', start: '2026-05-25T09:00', end: '2026-05-25T10:00' });
    await tick();

    const chip = el.querySelector('[data-event-id="cd1"]');
    const sourceCol = el.querySelector('.ec-time-col[data-date="2026-05-25"]');
    sourceCol.getBoundingClientRect = () => ({ top: 100, left: 0, bottom: 1000, right: 390, width: 390, height: 900 });
    document.elementsFromPoint = () => [sourceCol];
    chip.classList.add('ec-event-editing');

    // Begin the drag and let the ghost materialise.
    firePointer(chip, 'pointerdown', { pointerType: 'touch', clientX: 50, clientY: 200 });
    firePointer(document, 'pointermove', { pointerType: 'touch', clientX: 60, clientY: 215 });

    // Simulate the pager having stepped forward two days (the real
    // codepath calls api.next twice; here we shortcut to gotoDate so
    // the test isn't coupled to the slide animation).
    el.calendarApi.gotoDate('2026-05-27');
    await tick();

    const newCol = el.querySelector('.ec-time-col[data-date="2026-05-27"]');
    expect(newCol).toBeTruthy();
    newCol.getBoundingClientRect = () => ({ top: 100, left: 0, bottom: 1000, right: 390, width: 390, height: 900 });
    document.elementsFromPoint = () => [newCol];

    // Drop at the same y position as the press → no time-of-day shift,
    // pure +2-day delta.
    firePointer(document, 'pointermove', { pointerType: 'touch', clientX: 60, clientY: 200 });
    firePointer(document, 'pointerup',   { pointerType: 'touch', clientX: 60, clientY: 200 });

    expect(onDrop).toHaveBeenCalled();
    const detail = onDrop.mock.calls[0][0];
    expect(detail.delta.days).toBe(2);

    const moved = el.calendarApi.getEventById('cd1');
    expect(moved.start.toISOString().substring(0, 10)).toBe('2026-05-27');
    expect(moved.start.toISOString().substring(11, 16)).toBe('09:00');
    expect(moved.end.toISOString().substring(0, 10)).toBe('2026-05-27');
    expect(moved.end.toISOString().substring(11, 16)).toBe('10:00');
  });

  it('aborts an in-flight day step on pointerup so the lift does not commit one extra day', async () => {
    const el = mount(`<div data-controller="calendar"
                            data-calendar-plugins-value='["TimeGrid","Interaction"]'
                            data-calendar-view-value="timeGridDay"
                            data-calendar-date-value="2026-05-25"
                            data-calendar-options-value='{"editable":true}'></div>`);
    await tick(2);
    el.calendarApi.addEvent({ id: 'ab1', title: 'Abort me', start: '2026-05-25T09:00', end: '2026-05-25T10:00' });
    await tick();

    const ctrl = app.getControllerForElementAndIdentifier(el, 'calendar');
    const pagerApi = ctrl._state.get('pagerApi');
    Object.defineProperty(pagerApi.element, 'offsetWidth', { configurable: true, value: 390 });
    pagerApi.element.getBoundingClientRect = () => ({
      left: 0, top: 0, right: 390, bottom: 700, width: 390, height: 700,
    });

    const chip = el.querySelector('[data-event-id="ab1"]');
    const sourceCol = el.querySelector('.ec-time-col[data-date="2026-05-25"]');
    sourceCol.getBoundingClientRect = () => ({ top: 100, left: 0, bottom: 1000, right: 390, width: 390, height: 900 });
    document.elementsFromPoint = () => [sourceCol];
    chip.classList.add('ec-event-editing');

    vi.useFakeTimers();
    try {
      firePointer(chip, 'pointerdown', { pointerType: 'touch', clientX: 50, clientY: 200 });
      firePointer(document, 'pointermove', { pointerType: 'touch', clientX: 60, clientY: 215 });
      firePointer(document, 'pointermove', { pointerType: 'touch', clientX: 380, clientY: 215 });
      // Advance just past the initial 850 ms hold so edgeHoldTick has
      // kicked off pagerApi.stepDuringDrag (a 230 ms slide that hasn't
      // landed yet).
      vi.advanceTimersByTime(860);
      // Lift mid-slide.
      firePointer(document, 'pointerup', { pointerType: 'touch', clientX: 380, clientY: 215 });
      // Let the would-be slide finish if it wasn't aborted.
      await vi.advanceTimersByTimeAsync(400);
      // Date should be unchanged — the slide was aborted before
      // rotateAndCommit ran.
      expect(el.calendarApi.getOption('date').toISOString().substring(0, 10)).toBe('2026-05-25');
    } finally {
      vi.useRealTimers();
    }
  });

  it('does not call setPointerCapture on touch chips so iOS capture loss can not strand the gesture', async () => {
    const el = mount(`<div data-controller="calendar"
                            data-calendar-plugins-value='["TimeGrid","Interaction"]'
                            data-calendar-view-value="timeGridDay"
                            data-calendar-date-value="2026-05-25"
                            data-calendar-options-value='{"editable":true}'></div>`);
    await tick(2);
    el.calendarApi.addEvent({ id: 'pc1', title: 'No capture', start: '2026-05-25T09:00', end: '2026-05-25T10:00' });
    await tick();

    const chip = el.querySelector('[data-event-id="pc1"]');
    const sourceCol = el.querySelector('.ec-time-col[data-date="2026-05-25"]');
    sourceCol.getBoundingClientRect = () => ({ top: 100, left: 0, bottom: 1000, right: 390, width: 390, height: 900 });
    document.elementsFromPoint = () => [sourceCol];
    chip.setPointerCapture = vi.fn();
    chip.classList.add('ec-event-editing');

    firePointer(chip, 'pointerdown', { pointerType: 'touch', clientX: 50, clientY: 200 });
    firePointer(document, 'pointermove', { pointerType: 'touch', clientX: 60, clientY: 215 });
    firePointer(document, 'pointermove', { pointerType: 'touch', clientX: 60, clientY: 222 });

    expect(chip.setPointerCapture).not.toHaveBeenCalled();
    firePointer(document, 'pointerup', { pointerType: 'touch', clientX: 60, clientY: 222 });
  });

  it('finalizes the gesture when iOS sends pointercancel without a touchend after the source chip was destroyed', async () => {
    const onDrop = vi.fn();
    const el = mount(`<div data-controller="calendar"
                            data-calendar-plugins-value='["TimeGrid","Interaction"]'
                            data-calendar-view-value="timeGridDay"
                            data-calendar-date-value="2026-05-25"
                            data-calendar-options-value='{"editable":true}'></div>`);
    await tick(2);
    el.calendarApi.setOption('eventDrop', onDrop);
    el.calendarApi.addEvent({ id: 'pcc1', title: 'Stuck', start: '2026-05-25T09:00', end: '2026-05-25T10:00' });
    await tick();

    const chip = el.querySelector('[data-event-id="pcc1"]');
    const sourceCol = el.querySelector('.ec-time-col[data-date="2026-05-25"]');
    sourceCol.getBoundingClientRect = () => ({ top: 100, left: 0, bottom: 1000, right: 390, width: 390, height: 900 });
    document.elementsFromPoint = () => [sourceCol];
    chip.classList.add('ec-event-editing');

    firePointer(chip, 'pointerdown', { pointerType: 'touch', clientX: 50, clientY: 200 });
    firePointer(document, 'pointermove', { pointerType: 'touch', clientX: 60, clientY: 215 });

    // Simulate the day-step having destroyed the source chip's column
    // by navigating the calendar — the chip's DOM node is now detached.
    el.calendarApi.gotoDate('2026-05-26');
    await tick();
    expect(document.contains(chip)).toBe(false);

    // The (still-current) view's column for the new day.
    const newCol = el.querySelector('.ec-time-col[data-date="2026-05-26"]');
    newCol.getBoundingClientRect = () => ({ top: 100, left: 0, bottom: 1000, right: 390, width: 390, height: 900 });
    document.elementsFromPoint = () => [newCol];

    // iOS fires pointercancel after the chip teardown — but no touchend
    // follows. Our pointercancel watchdog should commit the drag.
    firePointer(document, 'pointercancel', { pointerType: 'touch', clientX: 60, clientY: 200 });

    await new Promise((r) => setTimeout(r, 200));
    expect(onDrop).toHaveBeenCalled();
    const moved = el.calendarApi.getEventById('pcc1');
    expect(moved.start.toISOString().substring(0, 10)).toBe('2026-05-26');
  });

  it('removes the day-offset badge on pointerup', async () => {
    const el = mount(`<div data-controller="calendar"
                            data-calendar-plugins-value='["TimeGrid","Interaction"]'
                            data-calendar-view-value="timeGridDay"
                            data-calendar-date-value="2026-05-25"
                            data-calendar-options-value='{"editable":true}'></div>`);
    await tick(2);
    el.calendarApi.addEvent({ id: 'cl1', title: 'Cleanup', start: '2026-05-25T09:00', end: '2026-05-25T10:00' });
    await tick();

    const ctrl = app.getControllerForElementAndIdentifier(el, 'calendar');
    const stepSpy = vi.fn().mockResolvedValue(undefined);
    const pagerEl = ctrl._state.get('pagerApi').element;
    pagerEl.getBoundingClientRect = () => ({
      left: 0, top: 0, right: 390, bottom: 700, width: 390, height: 700,
    });
    ctrl._state.set('pagerApi', { stepDuringDrag: stepSpy, element: pagerEl });

    const chip = el.querySelector('[data-event-id="cl1"]');
    const sourceCol = el.querySelector('.ec-time-col[data-date="2026-05-25"]');
    sourceCol.getBoundingClientRect = () => ({ top: 100, left: 0, bottom: 1000, right: 390, width: 390, height: 900 });
    document.elementsFromPoint = () => [sourceCol];
    chip.classList.add('ec-event-editing');

    vi.useFakeTimers();
    try {
      firePointer(chip, 'pointerdown', { pointerType: 'touch', clientX: 50, clientY: 200 });
      firePointer(document, 'pointermove', { pointerType: 'touch', clientX: 60, clientY: 215 });
      firePointer(document, 'pointermove', { pointerType: 'touch', clientX: 380, clientY: 215 });
      await vi.advanceTimersByTimeAsync(900);
      expect(document.body.querySelector('.ec-day-offset-badge')).toBeTruthy();

      firePointer(document, 'pointerup', { pointerType: 'touch', clientX: 380, clientY: 215 });
      expect(document.body.querySelector('.ec-day-offset-badge')).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });
});
