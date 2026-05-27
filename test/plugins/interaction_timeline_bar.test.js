// @vitest-environment happy-dom
//
// Phase A5/A6 coverage:
//   1. dragging a ResourceTimeline bar horizontally fires eventDrop
//      with a day delta and commits via updateEvent
//   2. dragging the right resize handle fires eventResize and grows
//      the event by N days
//   3. dropping a bar onto a different resource row's ribbon includes
//      the new resourceIds in the eventDrop payload + updateEvent call.

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

function stubRect(el, rect) {
  el.getBoundingClientRect = () => Object.assign({
    top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0,
    x: 0, y: 0, toJSON() { return this; },
  }, rect);
}

describe('Interaction plugin — ResourceTimeline bars', () => {
  beforeEach(() => { document.body.innerHTML = ''; });
  afterEach(() => { app?.stop(); app = null; });

  it('horizontal drag commits a day-delta updateEvent', async () => {
    const el = mount(`<div data-controller="calendar"
      data-calendar-plugins-value='["ResourceTimeline","Interaction"]'
      data-calendar-view-value="resourceTimelineWeek"
      data-calendar-date-value="2026-05-25"
      data-calendar-options-value='{"editable":true,"slotWidth":100}'
      data-calendar-resources-value='[{"id":"r1","title":"Will"}]'></div>`);
    await tick(2);
    const onDrop = vi.fn();
    el.calendarApi.setOption('eventDrop', onDrop);
    el.calendarApi.addEvent({
      id: 'a', title: 'Job', resourceIds: ['r1'],
      start: '2026-05-26', end: '2026-05-27', allDay: true,
    });
    await tick();

    const chip = el.querySelector('[data-event-id="a"]');
    const ribbon = chip.closest('.ec-timeline-ribbon');
    stubRect(ribbon, { left: 0, right: 700, width: 700, top: 0, bottom: 40, height: 40 });

    fireOn(chip,     'pointerdown', { clientX: 150, clientY: 20 });
    fireOn(document, 'pointermove', { clientX: 350, clientY: 20 });
    fireOn(document, 'pointerup',   { clientX: 350, clientY: 20 });

    expect(onDrop).toHaveBeenCalled();
    expect(onDrop.mock.calls[0][0].delta.days).toBe(2);
    const moved = el.calendarApi.getEventById('a');
    expect(moved.start.toISOString().substring(0, 10)).toBe('2026-05-28');
  });

  it('right-edge resize commits an end-delta updateEvent', async () => {
    const el = mount(`<div data-controller="calendar"
      data-calendar-plugins-value='["ResourceTimeline","Interaction"]'
      data-calendar-view-value="resourceTimelineWeek"
      data-calendar-date-value="2026-05-25"
      data-calendar-options-value='{"editable":true,"slotWidth":100}'
      data-calendar-resources-value='[{"id":"r1","title":"Will"}]'></div>`);
    await tick(2);
    const onResize = vi.fn();
    el.calendarApi.setOption('eventResize', onResize);
    el.calendarApi.addEvent({
      id: 'b', title: 'Job', resourceIds: ['r1'],
      start: '2026-05-26', end: '2026-05-27', allDay: true,
    });
    await tick();

    const chip = el.querySelector('[data-event-id="b"]');
    const ribbon = chip.closest('.ec-timeline-ribbon');
    stubRect(ribbon, { left: 0, right: 700, width: 700, top: 0, bottom: 40, height: 40 });
    const handle = chip.querySelector('.ec-resizer-x-end');
    expect(handle).toBeTruthy();

    fireOn(handle,   'pointerdown', { clientX: 200, clientY: 20 });
    fireOn(document, 'pointermove', { clientX: 400, clientY: 20 });
    fireOn(document, 'pointerup',   { clientX: 400, clientY: 20 });

    expect(onResize).toHaveBeenCalled();
    expect(onResize.mock.calls[0][0].endDelta.days).toBe(2);
    const grown = el.calendarApi.getEventById('b');
    expect(grown.end.toISOString().substring(0, 10)).toBe('2026-05-29');
  });

  it('drop on a different row includes newResource in payload (A6)', async () => {
    const el = mount(`<div data-controller="calendar"
      data-calendar-plugins-value='["ResourceTimeline","Interaction"]'
      data-calendar-view-value="resourceTimelineWeek"
      data-calendar-date-value="2026-05-25"
      data-calendar-options-value='{"editable":true,"slotWidth":100}'
      data-calendar-resources-value='[
        {"id":"r1","title":"Will"},
        {"id":"r2","title":"Mike"}
      ]'></div>`);
    await tick(2);
    const onDrop = vi.fn();
    el.calendarApi.setOption('eventDrop', onDrop);
    el.calendarApi.addEvent({
      id: 'c', title: 'Job', resourceIds: ['r1'],
      start: '2026-05-26', end: '2026-05-27', allDay: true,
    });
    await tick();

    const chip = el.querySelector('[data-event-id="c"]');
    const sourceRibbon = chip.closest('.ec-timeline-ribbon');
    stubRect(sourceRibbon, { left: 0, right: 700, width: 700, top: 0, bottom: 40, height: 40 });
    const targetRow = el.querySelector('[data-resource-id="r2"]');
    const targetRibbon = targetRow.querySelector('.ec-timeline-ribbon');
    stubRect(targetRibbon, { left: 0, right: 700, width: 700, top: 40, bottom: 80, height: 40 });

    // The handler ribbon-hit-tests via elementsFromPoint on every move
    // and on pointerup. Return the target ribbon so the drop lands on r2.
    document.elementsFromPoint = () => [targetRibbon];

    fireOn(chip,     'pointerdown', { clientX: 150, clientY: 20 });
    fireOn(document, 'pointermove', { clientX: 250, clientY: 60 });
    fireOn(document, 'pointerup',   { clientX: 250, clientY: 60 });

    expect(onDrop).toHaveBeenCalled();
    const detail = onDrop.mock.calls[0][0];
    expect(detail.oldResource).toBe('r1');
    expect(detail.newResource).toBe('r2');
    expect(detail.newResourceIds).toEqual(['r2']);
    const moved = el.calendarApi.getEventById('c');
    expect(moved.resourceIds).toEqual(['r2']);
  });
});
