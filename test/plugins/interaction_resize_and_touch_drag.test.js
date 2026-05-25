// @vitest-environment happy-dom
//
// Coverage for:
//   - the bottom-edge resize handle on TimeGrid event chips (renders only
//     when editable / eventDurationEditable is on, fires eventResize on
//     pointerup, snaps the delta to slotDuration, supports revert());
//   - the start-edge resize handle when eventResizableFromStart is on;
//   - sub-day TimeGrid drag — dropping a chip at a lower y-position
//     within a TimeGrid column should shift the event's start time by
//     the column's slot resolution (not just whole days).

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
  const ev = new PointerEvent(type, Object.assign({
    bubbles: true, cancelable: true, pointerId: 1, button: 0,
  }, init));
  target.dispatchEvent(ev);
  return ev;
}

describe('Interaction — resize handle', () => {
  beforeEach(() => { document.body.innerHTML = ''; });
  afterEach(() => { app?.stop(); app = null; vi.restoreAllMocks(); });

  it('does not render a resizer when editable is off', async () => {
    const el = mount(`<div data-controller="calendar"
                            data-calendar-plugins-value='["TimeGrid","Interaction"]'
                            data-calendar-date-value="2026-05-25"></div>`);
    await tick(2);
    el.calendarApi.addEvent({ id: 'n1', title: 'No resize', start: '2026-05-25T09:00', end: '2026-05-25T10:00' });
    await tick();
    expect(el.querySelector('[data-event-id="n1"] .ec-resizer')).toBeNull();
  });

  it('renders a bottom resizer when editable is on', async () => {
    const el = mount(`<div data-controller="calendar"
                            data-calendar-plugins-value='["TimeGrid","Interaction"]'
                            data-calendar-date-value="2026-05-25"
                            data-calendar-options-value='{"editable":true}'></div>`);
    await tick(2);
    el.calendarApi.addEvent({ id: 'y1', title: 'Resize me', start: '2026-05-25T09:00', end: '2026-05-25T10:00' });
    await tick();
    const handle = el.querySelector('[data-event-id="y1"] .ec-resizer');
    expect(handle).toBeTruthy();
    expect(handle.getAttribute('data-resizer')).toBe('end');
  });

  it('renders a start resizer when eventResizableFromStart is on', async () => {
    const el = mount(`<div data-controller="calendar"
                            data-calendar-plugins-value='["TimeGrid","Interaction"]'
                            data-calendar-date-value="2026-05-25"
                            data-calendar-options-value='{"editable":true,"eventResizableFromStart":true}'></div>`);
    await tick(2);
    el.calendarApi.addEvent({ id: 's1', title: 'Two-sided', start: '2026-05-25T09:00', end: '2026-05-25T10:00' });
    await tick();
    expect(el.querySelector('[data-event-id="s1"] .ec-resizer.ec-resizer-end')).toBeTruthy();
    expect(el.querySelector('[data-event-id="s1"] .ec-resizer.ec-resizer-start')).toBeTruthy();
  });

  it('dragging the bottom resizer down fires eventResize and shifts the end time', async () => {
    const onResize = vi.fn();
    const el = mount(`<div data-controller="calendar"
                            data-calendar-plugins-value='["TimeGrid","Interaction"]'
                            data-calendar-date-value="2026-05-25"
                            data-calendar-options-value='{"editable":true}'></div>`);
    await tick(2);
    el.calendarApi.setOption('eventResize', onResize);
    el.calendarApi.addEvent({ id: 'r1', title: 'Stretch', start: '2026-05-25T09:00', end: '2026-05-25T10:00' });
    await tick();

    const chip = el.querySelector('[data-event-id="r1"]');
    const handle = chip.querySelector('.ec-resizer');
    expect(handle).toBeTruthy();
    // Set a known initial height (the default render uses 22px/slot × 60 min = 44px for 1 hour).
    chip.style.top = '0px';
    chip.style.height = '44px';

    // slotDuration default = 30min, slotHeight default = 22px → pxPerMin = 22/30.
    // To extend by 30min, drag down by 22px.
    fire(handle, 'pointerdown', { clientY: 100 });
    fire(document, 'pointermove', { clientY: 122 });
    fire(document, 'pointerup',   { clientY: 122 });

    expect(onResize).toHaveBeenCalled();
    const moved = el.calendarApi.getEventById('r1');
    expect(moved.end.toISOString().substring(11, 16)).toBe('10:30');
  });

  it('revert() in eventResize keeps original end time', async () => {
    const el = mount(`<div data-controller="calendar"
                            data-calendar-plugins-value='["TimeGrid","Interaction"]'
                            data-calendar-date-value="2026-05-25"
                            data-calendar-options-value='{"editable":true}'></div>`);
    await tick(2);
    el.calendarApi.setOption('eventResize', (d) => d.revert());
    el.calendarApi.addEvent({ id: 'rv1', title: 'Keep', start: '2026-05-25T09:00', end: '2026-05-25T10:00' });
    await tick();

    const chip = el.querySelector('[data-event-id="rv1"]');
    const handle = chip.querySelector('.ec-resizer');
    chip.style.top = '0px';
    chip.style.height = '44px';

    fire(handle, 'pointerdown', { clientY: 100 });
    fire(document, 'pointermove', { clientY: 200 });
    fire(document, 'pointerup',   { clientY: 200 });

    const after = el.calendarApi.getEventById('rv1');
    expect(after.end.toISOString().substring(11, 16)).toBe('10:00');
  });
});

describe('Interaction — TimeGrid sub-day drag', () => {
  beforeEach(() => { document.body.innerHTML = ''; });
  afterEach(() => { app?.stop(); app = null; vi.restoreAllMocks(); });

  it('dropping into the same column at a lower y-offset shifts the start time, snapped to slot', async () => {
    const onDrop = vi.fn();
    const el = mount(`<div data-controller="calendar"
                            data-calendar-plugins-value='["TimeGrid","Interaction"]'
                            data-calendar-date-value="2026-05-25"
                            data-calendar-options-value='{"editable":true}'></div>`);
    await tick(2);
    el.calendarApi.setOption('eventDrop', onDrop);
    el.calendarApi.addEvent({ id: 't1', title: 'Slide down', start: '2026-05-25T09:00', end: '2026-05-25T10:00' });
    await tick();

    const chip   = el.querySelector('[data-event-id="t1"]');
    const col    = el.querySelector('.ec-time-col[data-date="2026-05-25"]');
    expect(chip && col).toBeTruthy();

    // Stub getBoundingClientRect so the y-offset arithmetic is deterministic.
    // The column starts at y=100 (top); pxPerMin = 22/30 (defaults).
    col.getBoundingClientRect = () => ({ top: 100, left: 0, bottom: 1000, right: 200, width: 200, height: 900 });
    document.elementsFromPoint = () => [col];

    // pointerdown at clientY=200 (i.e. 100px inside the col → 100 / (22/30) ≈ 136 min).
    // pointermove + up at clientY=222 → 122px inside col → 166 min → start shifts by ~30min snapped.
    fire(chip, 'pointerdown', { clientX: 50, clientY: 200 });
    fire(document, 'pointermove', { clientX: 60, clientY: 222 });
    fire(document, 'pointerup',   { clientX: 60, clientY: 222 });

    expect(onDrop).toHaveBeenCalled();
    const moved = el.calendarApi.getEventById('t1');
    // 09:00 + 30min = 09:30
    expect(moved.start.toISOString().substring(11, 16)).toBe('09:30');
    expect(moved.end.toISOString().substring(11, 16)).toBe('10:30');
  });

  it('zero delta does not commit', async () => {
    const onDrop = vi.fn();
    const el = mount(`<div data-controller="calendar"
                            data-calendar-plugins-value='["TimeGrid","Interaction"]'
                            data-calendar-date-value="2026-05-25"
                            data-calendar-options-value='{"editable":true}'></div>`);
    await tick(2);
    el.calendarApi.setOption('eventDrop', onDrop);
    el.calendarApi.addEvent({ id: 'z1', title: 'Stay', start: '2026-05-25T09:00', end: '2026-05-25T10:00' });
    await tick();

    const chip = el.querySelector('[data-event-id="z1"]');
    const col  = el.querySelector('.ec-time-col[data-date="2026-05-25"]');
    col.getBoundingClientRect = () => ({ top: 100, left: 0, bottom: 1000, right: 200, width: 200, height: 900 });
    document.elementsFromPoint = () => [col];

    fire(chip, 'pointerdown', { clientX: 50, clientY: 200 });
    fire(document, 'pointermove', { clientX: 60, clientY: 210 }); // tiny move, snaps to 0
    fire(document, 'pointerup',   { clientX: 60, clientY: 210 });

    expect(onDrop).not.toHaveBeenCalled();
  });
});
