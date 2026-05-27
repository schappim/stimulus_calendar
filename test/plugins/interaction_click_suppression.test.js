// @vitest-environment happy-dom
//
// Verifies that the post-gesture synthesised `click` event on a chip
// is swallowed by the controller's capture-phase listener after a
// drag or resize ends. Without this, single-tap-opens-popover hosts
// see a phantom popover after every commit/abort.
//
// We don't rely on the real browser's pointerup→click synthesis here
// — happy-dom doesn't synthesise. Instead, the test dispatches the
// click explicitly after the pointer sequence, which is what the
// browser would do at runtime.

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

function firePointer(target, type, init = {}) {
  const ev = new PointerEvent(type, Object.assign({ bubbles: true, cancelable: true, pointerId: 1, button: 0 }, init));
  target.dispatchEvent(ev);
}

function fireClick(target, init = {}) {
  const ev = new MouseEvent('click', Object.assign({ bubbles: true, cancelable: true, button: 0 }, init));
  target.dispatchEvent(ev);
}

describe('post-gesture click suppression', () => {
  beforeEach(() => { document.body.innerHTML = ''; });
  afterEach(() => { app?.stop(); app = null; });

  it('a click synthesised after eventDrop does NOT fire eventClick', async () => {
    const onClick = vi.fn();
    const el = mount(`<div data-controller="calendar"
                            data-calendar-plugins-value='["DayGrid","Interaction"]'
                            data-calendar-date-value="2026-05-15"
                            data-calendar-options-value='{"editable":true}'></div>`);
    await tick(2);
    el.calendarApi.setOption('eventClick', onClick);
    el.calendarApi.addEvent({
      id: 'm1', title: 'Drag me',
      start: '2026-05-15T09:00', end: '2026-05-15T10:00',
    });
    await tick();

    const chip   = el.querySelector('[data-event-id="m1"]');
    const target = el.querySelector('[data-date="2026-05-16"]');
    expect(chip && target).toBeTruthy();
    document.elementsFromPoint = () => [target];

    firePointer(chip,     'pointerdown', { clientX: 100, clientY: 100 });
    firePointer(document, 'pointermove', { clientX: 200, clientY: 200 });
    firePointer(document, 'pointerup',   { clientX: 300, clientY: 300 });
    // updateEvent re-renders the grid synchronously inside pointerup,
    // so the original chip has been replaced. In the real browser, the
    // synthesised click lands on whatever's at the pointer's screen
    // position now — typically the chip in its new cell. Dispatch on
    // the new chip to reproduce that case.
    await tick();
    const movedChip = el.querySelector('[data-event-id="m1"]');
    expect(movedChip).toBeTruthy();
    fireClick(movedChip);

    expect(onClick).not.toHaveBeenCalled();
  });

  it('a click after a no-op tap (no drag) DOES fire eventClick', async () => {
    const onClick = vi.fn();
    const el = mount(`<div data-controller="calendar"
                            data-calendar-plugins-value='["DayGrid","Interaction"]'
                            data-calendar-date-value="2026-05-15"
                            data-calendar-options-value='{"editable":true}'></div>`);
    await tick(2);
    el.calendarApi.setOption('eventClick', onClick);
    el.calendarApi.addEvent({
      id: 't1', title: 'Tap me',
      start: '2026-05-15T09:00', end: '2026-05-15T10:00',
    });
    await tick();

    const chip = el.querySelector('[data-event-id="t1"]');

    // Pure tap — no pointermove past eventDragMinDistance. eventDrop
    // doesn't fire, so suppression isn't armed, so the click passes.
    firePointer(chip, 'pointerdown', { clientX: 100, clientY: 100 });
    firePointer(chip, 'pointerup',   { clientX: 100, clientY: 100 });
    fireClick(chip);

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('a click on the calendar background (not a chip) is unaffected', async () => {
    const onClick = vi.fn();
    const el = mount(`<div data-controller="calendar"
                            data-calendar-plugins-value='["DayGrid","Interaction"]'
                            data-calendar-date-value="2026-05-15"
                            data-calendar-options-value='{"editable":true}'></div>`);
    await tick(2);
    el.calendarApi.setOption('eventClick', onClick);
    el.calendarApi.addEvent({
      id: 'm2', title: 'Drag me',
      start: '2026-05-15T09:00', end: '2026-05-15T10:00',
    });
    await tick();

    const chip      = el.querySelector('[data-event-id="m2"]');
    const target    = el.querySelector('[data-date="2026-05-16"]');
    const bgcell    = el.querySelector('[data-date="2026-05-22"]');
    document.elementsFromPoint = () => [target];

    // Drag from chip → arms suppression.
    firePointer(chip,     'pointerdown', { clientX: 100, clientY: 100 });
    firePointer(document, 'pointermove', { clientX: 200, clientY: 200 });
    firePointer(document, 'pointerup',   { clientX: 300, clientY: 300 });

    // Click on a background cell (not a chip). The suppression flag is
    // still armed, but the consume listener only stops clicks on
    // `[data-event-id]`. Background clicks should reach handlers
    // normally — and importantly, the flag stays armed until a real
    // chip click consumes it OR the safety timeout fires.
    fireClick(bgcell);

    expect(onClick).not.toHaveBeenCalled();
    // eventClick fires from chip click handlers only, so the
    // background click can't fire it anyway. The assertion above is
    // really verifying that the background click doesn't throw.
  });
});
