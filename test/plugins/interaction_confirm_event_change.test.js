// @vitest-environment happy-dom
//
// Verifies the S1 recurrence-aware change confirmation hook:
//
//   - eventDrop detail carries isOccurrence + seriesId for series
//     members.
//   - confirmEventChange is called for series events; non-series
//     events skip the hook entirely.
//   - The updateEvent commit is deferred until confirmEventChange
//     resolves.
//   - { proceed: true, scope } commits and fires
//     `calendar:eventChangeConfirmed` with the chosen scope.
//   - { proceed: false } discards — no updateEvent, no
//     eventChangeConfirmed fire.

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
const tick = (n = 1) => Promise.all(Array.from({ length: n }, () => new Promise((r) => setTimeout(r, 0))));

function firePointer(target, type, init = {}) {
  const ev = new PointerEvent(type, Object.assign({ bubbles: true, cancelable: true, pointerId: 1, button: 0 }, init));
  target.dispatchEvent(ev);
}

describe('Interaction — confirmEventChange (recurrence-aware)', () => {
  beforeEach(() => { document.body.innerHTML = ''; });
  afterEach(() => { app?.stop(); app = null; });

  it('eventDrop detail carries isOccurrence + seriesId for an event with extendedProps.rrule', async () => {
    const onDrop = vi.fn();
    const el = await mount(`<div data-controller="calendar"
      data-calendar-plugins-value='["DayGrid","Interaction"]'
      data-calendar-date-value="2026-05-15"
      data-calendar-options-value='{"editable":true}'></div>`);
    el.calendarApi.setOption('eventDrop', onDrop);
    el.calendarApi.addEvent({
      id: 'master-42',
      title: 'Weekly stand-up',
      start: '2026-05-15T09:00', end: '2026-05-15T09:30',
      extendedProps: { rrule: 'FREQ=WEEKLY;BYDAY=FR' },
    });
    await tick();

    const chip   = el.querySelector('[data-event-id="master-42"]');
    const target = el.querySelector('[data-date="2026-05-16"]');
    document.elementsFromPoint = () => [target];

    firePointer(chip,     'pointerdown', { clientX: 100, clientY: 100 });
    firePointer(document, 'pointermove', { clientX: 200, clientY: 200 });
    firePointer(document, 'pointerup',   { clientX: 300, clientY: 300 });

    expect(onDrop).toHaveBeenCalled();
    const detail = onDrop.mock.calls[0][0];
    expect(detail.isOccurrence).toBe(true);
    expect(detail.seriesId).toBe('master-42');
  });

  it('non-series events do not invoke confirmEventChange', async () => {
    const confirmFn = vi.fn();
    const el = await mount(`<div data-controller="calendar"
      data-calendar-plugins-value='["DayGrid","Interaction"]'
      data-calendar-date-value="2026-05-15"
      data-calendar-options-value='{"editable":true}'></div>`);
    el.calendarApi.setOption('confirmEventChange', confirmFn);
    el.calendarApi.addEvent({
      id: 'one-off',
      title: 'One-off',
      start: '2026-05-15T09:00', end: '2026-05-15T09:30',
    });
    await tick();

    const chip   = el.querySelector('[data-event-id="one-off"]');
    const target = el.querySelector('[data-date="2026-05-16"]');
    document.elementsFromPoint = () => [target];

    firePointer(chip,     'pointerdown', { clientX: 100, clientY: 100 });
    firePointer(document, 'pointermove', { clientX: 200, clientY: 200 });
    firePointer(document, 'pointerup',   { clientX: 300, clientY: 300 });
    await tick(2);

    expect(confirmFn).not.toHaveBeenCalled();
    // updateEvent ran as before (event moved one day).
    expect(el.calendarApi.getEventById('one-off').start.toISOString().substring(0, 10)).toBe('2026-05-16');
  });

  it('confirmEventChange returning proceed: true commits + fires eventChangeConfirmed', async () => {
    const onConfirmed = vi.fn();
    const el = await mount(`<div data-controller="calendar"
      data-calendar-plugins-value='["DayGrid","Interaction"]'
      data-calendar-date-value="2026-05-15"
      data-calendar-options-value='{"editable":true}'></div>`);
    el.calendarApi.setOption('confirmEventChange',
      async () => ({ proceed: true, scope: 'occurrence' }));
    el.addEventListener('calendar:eventChangeConfirmed', (ev) => onConfirmed(ev.detail));
    el.calendarApi.addEvent({
      id: 'master-42',
      title: 'Weekly stand-up',
      start: '2026-05-15T09:00', end: '2026-05-15T09:30',
      extendedProps: { rrule: 'FREQ=WEEKLY;BYDAY=FR' },
    });
    await tick();

    const chip   = el.querySelector('[data-event-id="master-42"]');
    const target = el.querySelector('[data-date="2026-05-16"]');
    document.elementsFromPoint = () => [target];

    firePointer(chip,     'pointerdown', { clientX: 100, clientY: 100 });
    firePointer(document, 'pointermove', { clientX: 200, clientY: 200 });
    firePointer(document, 'pointerup',   { clientX: 300, clientY: 300 });

    // Until the promise resolves, the event hasn't moved.
    expect(el.calendarApi.getEventById('master-42').start.toISOString().substring(0, 10)).toBe('2026-05-15');

    // Let the promise resolve + the post-then commit run.
    await tick(2);

    expect(el.calendarApi.getEventById('master-42').start.toISOString().substring(0, 10)).toBe('2026-05-16');
    expect(onConfirmed).toHaveBeenCalled();
    expect(onConfirmed.mock.calls[0][0].scope).toBe('occurrence');
    expect(onConfirmed.mock.calls[0][0].seriesId).toBe('master-42');
    expect(onConfirmed.mock.calls[0][0].kind).toBe('drop');
  });

  it('confirmEventChange returning proceed: false discards the change', async () => {
    const onConfirmed = vi.fn();
    const el = await mount(`<div data-controller="calendar"
      data-calendar-plugins-value='["DayGrid","Interaction"]'
      data-calendar-date-value="2026-05-15"
      data-calendar-options-value='{"editable":true}'></div>`);
    el.calendarApi.setOption('confirmEventChange',
      async () => ({ proceed: false }));
    el.addEventListener('calendar:eventChangeConfirmed', (ev) => onConfirmed(ev.detail));
    el.calendarApi.addEvent({
      id: 'master-42', title: 'Stay put',
      start: '2026-05-15T09:00', end: '2026-05-15T09:30',
      extendedProps: { series: { id: 'series-99' } },
    });
    await tick();

    const chip   = el.querySelector('[data-event-id="master-42"]');
    const target = el.querySelector('[data-date="2026-05-16"]');
    document.elementsFromPoint = () => [target];

    firePointer(chip,     'pointerdown', { clientX: 100, clientY: 100 });
    firePointer(document, 'pointermove', { clientX: 200, clientY: 200 });
    firePointer(document, 'pointerup',   { clientX: 300, clientY: 300 });
    await tick(2);

    // Event unchanged.
    expect(el.calendarApi.getEventById('master-42').start.toISOString().substring(0, 10)).toBe('2026-05-15');
    expect(onConfirmed).not.toHaveBeenCalled();
  });
});
