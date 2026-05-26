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

function fireTouch(target, type, touches, changedTouches = touches) {
  const ev = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(ev, 'touches', { value: touches });
  Object.defineProperty(ev, 'changedTouches', { value: changedTouches });
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

  it('touch starting on a resize handle outside edit mode does not start a resize gesture', async () => {
    const onResize = vi.fn();
    const el = mount(`<div data-controller="calendar"
                            data-calendar-plugins-value='["TimeGrid","Interaction"]'
                            data-calendar-date-value="2026-05-25"
                            data-calendar-options-value='{"editable":true}'></div>`);
    await tick(2);
    el.calendarApi.setOption('eventResize', onResize);
    el.calendarApi.addEvent({ id: 'rt1', title: 'Scroll past handle', start: '2026-05-25T09:00', end: '2026-05-25T10:00' });
    await tick();

    const chip = el.querySelector('[data-event-id="rt1"]');
    const handle = chip.querySelector('.ec-resizer');
    fire(handle, 'pointerdown', { pointerType: 'touch', clientY: 100 });
    fire(document, 'pointermove', { pointerType: 'touch', clientY: 180 });
    fire(document, 'pointerup',   { pointerType: 'touch', clientY: 180 });

    expect(onResize).not.toHaveBeenCalled();
    const event = el.calendarApi.getEventById('rt1');
    expect(event.end.toISOString().substring(11, 16)).toBe('10:00');
  });

  it('touch dragging an edit-mode resize handle changes duration and locks scroll', async () => {
    const onResize = vi.fn();
    const el = mount(`<div data-controller="calendar"
                            data-calendar-plugins-value='["TimeGrid","Interaction"]'
                            data-calendar-date-value="2026-05-25"
                            data-calendar-options-value='{"editable":true}'></div>`);
    await tick(2);
    el.calendarApi.setOption('eventResize', onResize);
    el.calendarApi.addEvent({ id: 'rt-edit', title: 'Resize by touch', start: '2026-05-25T09:00', end: '2026-05-25T10:00' });
    await tick();

    const chip = el.querySelector('[data-event-id="rt-edit"]');
    const handle = chip.querySelector('.ec-resizer');
    chip.classList.add('ec-event-editing');
    chip.style.top = '0px';
    chip.style.height = '44px';

    fire(handle, 'pointerdown', { pointerType: 'touch', clientY: 100 });
    const move = fireTouch(document, 'touchmove', [{ identifier: 1, clientX: 50, clientY: 122 }]);
    fireTouch(document, 'touchend', [], [{ identifier: 1, clientX: 50, clientY: 122 }]);

    expect(move.defaultPrevented).toBe(true);
    expect(onResize).toHaveBeenCalled();
    const event = el.calendarApi.getEventById('rt-edit');
    expect(event.end.toISOString().substring(11, 16)).toBe('10:30');
  });

  it('only renders the end-resizer on the last segment of a multi-day timed event', async () => {
    const el = mount(`<div data-controller="calendar"
                            data-calendar-plugins-value='["TimeGrid","Interaction"]'
                            data-calendar-date-value="2026-05-25"
                            data-calendar-options-value='{"editable":true}'></div>`);
    await tick(2);
    el.calendarApi.addEvent({
      id: 'm1', title: 'Three-day',
      start: '2026-05-25T10:00:00',
      end:   '2026-05-27T14:00:00',
    });
    await tick();

    const segments = el.querySelectorAll('[data-event-id="m1"]');
    expect(segments.length).toBe(3);
    // Last segment (no continues-to) is the only one with an end-resizer.
    let withResizer = 0;
    for (const seg of segments) {
      if (seg.querySelector('.ec-resizer-end')) withResizer += 1;
    }
    expect(withResizer).toBe(1);
    const last = el.querySelector('[data-event-id="m1"]:not(.ec-event-continues-to)');
    expect(last.querySelector('.ec-resizer-end')).toBeTruthy();
  });

  it('long-pressing a multi-day timed event promotes every segment into edit mode', async () => {
    const el = mount(`<div data-controller="calendar"
                            data-calendar-plugins-value='["TimeGrid","Interaction"]'
                            data-calendar-date-value="2026-05-25"
                            data-calendar-options-value='{"editable":true}'></div>`);
    await tick(2);
    el.calendarApi.addEvent({
      id: 'mle1', title: 'Two-day',
      start: '2026-05-26T16:30:00',
      end:   '2026-05-27T17:00:00',
    });
    await tick();

    const segments = el.querySelectorAll('[data-event-id="mle1"]');
    expect(segments.length).toBe(2);

    // Long-press the FIRST segment — every segment of the event should
    // gain .ec-event-editing so the CSS handle pseudo-elements can land
    // on the correct ends (start circle on the first segment, end circle
    // on the last). The pseudo-element circles are CSS-only and not
    // queryable in JSDOM, but the controlling class is.
    const first = segments[0];
    vi.useFakeTimers();
    try {
      fire(first, 'pointerdown', { pointerType: 'touch', clientX: 50, clientY: 200 });
      vi.advanceTimersByTime(1100);
    } finally {
      vi.useRealTimers();
    }

    for (const seg of segments) {
      expect(seg.classList.contains('ec-event-editing')).toBe(true);
    }

    // Release the pointer so this test's drag state doesn't leak into
    // the next test's resize gesture (a held pointerdown stays armed).
    fireTouch(document, 'touchend', [], [{ identifier: 1, clientX: 50, clientY: 200 }]);
    fire(document, 'pointerup', { pointerType: 'touch', clientX: 50, clientY: 200 });
  });

  it('dragging the last-segment resizer leftward into an earlier day shortens the event to that day', async () => {
    const onResize = vi.fn();
    const el = mount(`<div data-controller="calendar"
                            data-calendar-plugins-value='["TimeGrid","Interaction"]'
                            data-calendar-date-value="2026-05-25"
                            data-calendar-options-value='{"editable":true}'></div>`);
    await tick(2);
    el.calendarApi.setOption('eventResize', onResize);
    el.calendarApi.addEvent({
      id: 'sb1', title: 'Three-day',
      start: '2026-05-25T10:00:00',
      end:   '2026-05-27T14:00:00',
    });
    await tick();

    // Find the three day columns and pin deterministic geometry.
    const monCol = el.querySelector('.ec-time-col[data-date="2026-05-25"]');
    const tueCol = el.querySelector('.ec-time-col[data-date="2026-05-26"]');
    const wedCol = el.querySelector('.ec-time-col[data-date="2026-05-27"]');
    expect(monCol && tueCol && wedCol).toBeTruthy();
    monCol.getBoundingClientRect = () => ({ top: 100, left: 200, bottom: 1000, right: 300, width: 100, height: 900 });
    tueCol.getBoundingClientRect = () => ({ top: 100, left: 300, bottom: 1000, right: 400, width: 100, height: 900 });
    wedCol.getBoundingClientRect = () => ({ top: 100, left: 400, bottom: 1000, right: 500, width: 100, height: 900 });
    // Route elementsFromPoint by x — happy-dom won't do hit-testing itself.
    document.elementsFromPoint = (x) => {
      if (x >= 400) return [wedCol];
      if (x >= 300) return [tueCol];
      if (x >= 200) return [monCol];
      return [];
    };

    const last = el.querySelector('[data-event-id="sb1"]:not(.ec-event-continues-to)');
    const handle = last.querySelector('.ec-resizer-end');
    expect(handle).toBeTruthy();

    // pointerdown inside Wed col → pointermove into Tue col at clientY=250
    // (yIn=150, pxPerMin=24/30=0.8, → 187.5min → snapped to 180min = 03:00) →
    // pointerup. New end should be Tue May 26 03:00 UTC.
    fire(handle, 'pointerdown', { clientX: 450, clientY: 200 });
    fire(document, 'pointermove', { clientX: 350, clientY: 250 });
    fire(document, 'pointerup',   { clientX: 350, clientY: 250 });

    expect(onResize).toHaveBeenCalled();
    const after = el.calendarApi.getEventById('sb1');
    expect(after.end.toISOString().substring(0, 10)).toBe('2026-05-26');
    expect(after.end.toISOString().substring(11, 16)).toBe('03:00');
    // Start is unchanged.
    expect(after.start.toISOString().substring(0, 16)).toBe('2026-05-25T10:00');
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
