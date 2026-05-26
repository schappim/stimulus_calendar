// @vitest-environment happy-dom
//
// Coverage for the wall-clock vertical snap during a TimeGrid event
// drag (mirrors mobile_schedule_controller's vertical snap):
//
//   - the proposed start is snapped to the nearest snapDuration on the
//     absolute wall-clock grid, NOT on the delta — so a 09:07 event
//     lands on 09:15 / 09:30 as the finger drags, not 09:22 / 09:37;
//   - the ghost's top is rendered at the snapped Y, so the tile holds
//     position between snap boundaries (the user's finger keeps
//     moving but the tile only jumps on quarter-hour crossings);
//   - the chip's own time-of-day text is hidden during the drag so
//     the now-stale label doesn't read as noise;
//   - a single floating ":15 / :30 / :45" tag is appended into the
//     live view's sidebar, anchored to the snapped Y;
//   - on the hour the tag is removed (the static hour label is
//     already there);
//   - on commit the snapped wall-clock start is what hits
//     api.updateEvent, and the chip's time text is restored.

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

describe('Interaction — wall-clock vertical snap on TimeGrid drag', () => {
  beforeEach(() => { document.body.innerHTML = ''; });
  afterEach(() => { app?.stop(); app = null; vi.restoreAllMocks(); });

  it('snaps an off-grid event to the wall-clock 15-min boundary on commit', async () => {
    const onDrop = vi.fn();
    const el = mount(`<div data-controller="calendar"
                            data-calendar-plugins-value='["TimeGrid","Interaction"]'
                            data-calendar-view-value="timeGridDay"
                            data-calendar-date-value="2026-05-25"
                            data-calendar-options-value='{"editable":true,"snapDuration":"00:15:00"}'></div>`);
    await tick(2);
    el.calendarApi.setOption('eventDrop', onDrop);
    // 09:07 → 10:07 — deliberately off the 15-min grid. A delta-snap
    // would land on 09:22 / 09:37; a wall-clock snap lands on 09:15 /
    // 09:30 instead.
    el.calendarApi.addEvent({ id: 'wc1', title: 'Off-grid', start: '2026-05-25T09:07', end: '2026-05-25T10:07' });
    await tick();

    const chip = el.querySelector('[data-event-id="wc1"]');
    const col = el.querySelector('.ec-time-col[data-date="2026-05-25"]');
    col.getBoundingClientRect = () => ({ top: 100, left: 0, bottom: 1000, right: 390, width: 390, height: 900 });
    document.elementsFromPoint = () => [col];
    chip.classList.add('ec-event-editing');

    // Default slotHeight=24, slotDuration=30 → pxPerMin = 0.8.
    // From 09:07 we want to land on 09:15. That's +8 min ≈ 6.4 px down,
    // but we move 12 px (≈ 15 min) so the proposed = 09:22 → snap to
    // wall-clock 09:15.
    firePointer(chip, 'pointerdown', { pointerType: 'touch', clientX: 50, clientY: 200 });
    firePointer(document, 'pointermove', { pointerType: 'touch', clientX: 50, clientY: 212 });
    firePointer(document, 'pointerup',   { pointerType: 'touch', clientX: 50, clientY: 212 });

    expect(onDrop).toHaveBeenCalled();
    const moved = el.calendarApi.getEventById('wc1');
    expect(moved.start.toISOString().substring(11, 16)).toBe('09:15');
    expect(moved.end.toISOString().substring(11, 16)).toBe('10:15');
  });

  it('renders the ghost at the snapped Y, not the cursor Y', async () => {
    const el = mount(`<div data-controller="calendar"
                            data-calendar-plugins-value='["TimeGrid","Interaction"]'
                            data-calendar-view-value="timeGridDay"
                            data-calendar-date-value="2026-05-25"
                            data-calendar-options-value='{"editable":true,"snapDuration":"00:15:00"}'></div>`);
    await tick(2);
    el.calendarApi.addEvent({ id: 'g1', title: 'Snap hold', start: '2026-05-25T09:00', end: '2026-05-25T10:00' });
    await tick();

    const chip = el.querySelector('[data-event-id="g1"]');
    const col = el.querySelector('.ec-time-col[data-date="2026-05-25"]');
    col.getBoundingClientRect = () => ({ top: 100, left: 0, bottom: 1000, right: 390, width: 390, height: 900 });
    document.elementsFromPoint = () => [col];
    chip.classList.add('ec-event-editing');

    firePointer(chip, 'pointerdown', { pointerType: 'touch', clientX: 50, clientY: 200 });
    // First move past dragMinDist (5 px default), kept strictly inside
    // the first half of the snap step: dy=5 → 6.25 min → proposed
    // 09:06.25 → round(36.42)*15 = 540 → snap stays at 09:00. The
    // ghost materialises and snappedDelta is 0, so its top equals the
    // baseline (startY − grabOffsetY). dy=6 would tie at 09:07.5 which
    // Math.round rounds UP to 09:15 — keep below that boundary.
    firePointer(document, 'pointermove', { pointerType: 'touch', clientX: 50, clientY: 205 });
    const ghost = document.body.querySelector('.ec-ghost');
    expect(ghost).toBeTruthy();
    const baselineTop = parseFloat(ghost.style.top);

    // Now move 12 px → 15 min → proposed 09:15 → snap 09:15 →
    // snappedDelta = +15 min = +12 px. Ghost should jump by ~12 px.
    firePointer(document, 'pointermove', { pointerType: 'touch', clientX: 50, clientY: 212 });
    const topAtSnap = parseFloat(ghost.style.top);
    expect(topAtSnap - baselineTop).toBeCloseTo(12, 1);

    // Halfway between snaps: 18 px down ≈ 22.5 min from 09:00 →
    // proposed 09:22.5 → snap 09:30 → +24 px.
    firePointer(document, 'pointermove', { pointerType: 'touch', clientX: 50, clientY: 218 });
    const topMidway = parseFloat(ghost.style.top);
    expect(topMidway - baselineTop).toBeCloseTo(24, 1);

    firePointer(document, 'pointerup', { pointerType: 'touch', clientX: 50, clientY: 218 });
  });

  it('hides the chip event-time text during the drag and restores it on release', async () => {
    const el = mount(`<div data-controller="calendar"
                            data-calendar-plugins-value='["TimeGrid","Interaction"]'
                            data-calendar-view-value="timeGridDay"
                            data-calendar-date-value="2026-05-25"
                            data-calendar-options-value='{"editable":true}'></div>`);
    await tick(2);
    el.calendarApi.addEvent({ id: 't1', title: 'Hide time', start: '2026-05-25T09:00', end: '2026-05-25T10:00' });
    await tick();

    const chip = el.querySelector('[data-event-id="t1"]');
    const timeEl = chip.querySelector('.ec-event-time');
    expect(timeEl).toBeTruthy();
    expect(timeEl.style.visibility).toBe('');

    const col = el.querySelector('.ec-time-col[data-date="2026-05-25"]');
    col.getBoundingClientRect = () => ({ top: 100, left: 0, bottom: 1000, right: 390, width: 390, height: 900 });
    document.elementsFromPoint = () => [col];
    chip.classList.add('ec-event-editing');

    firePointer(chip, 'pointerdown', { pointerType: 'touch', clientX: 50, clientY: 200 });
    firePointer(document, 'pointermove', { pointerType: 'touch', clientX: 60, clientY: 220 });
    // After the ghost has materialised, the time element on the source
    // chip is hidden (the live wall-clock proposal is in the gutter,
    // not on the chip).
    expect(chip.querySelector('.ec-event-time').style.visibility).toBe('hidden');

    firePointer(document, 'pointerup', { pointerType: 'touch', clientX: 60, clientY: 220 });
    // The commit re-renders the view; grab the new chip and confirm
    // its time text was restored (or, on the just-released chip,
    // visibility is empty).
    const after = el.querySelector('[data-event-id="t1"] .ec-event-time');
    expect(after.style.visibility).toBe('');
  });

  it('injects a :15 / :30 / :45 label into the sidebar at the snapped Y', async () => {
    const el = mount(`<div data-controller="calendar"
                            data-calendar-plugins-value='["TimeGrid","Interaction"]'
                            data-calendar-view-value="timeGridDay"
                            data-calendar-date-value="2026-05-25"
                            data-calendar-options-value='{"editable":true,"snapDuration":"00:15:00"}'></div>`);
    await tick(2);
    el.calendarApi.addEvent({ id: 'gl1', title: 'Gutter label', start: '2026-05-25T09:00', end: '2026-05-25T10:00' });
    await tick();

    const chip = el.querySelector('[data-event-id="gl1"]');
    const col = el.querySelector('.ec-time-col[data-date="2026-05-25"]');
    col.getBoundingClientRect = () => ({ top: 100, left: 0, bottom: 1000, right: 390, width: 390, height: 900 });
    document.elementsFromPoint = () => [col];
    chip.classList.add('ec-event-editing');

    firePointer(chip, 'pointerdown', { pointerType: 'touch', clientX: 50, clientY: 200 });
    // +12 px → +15 min → 09:15. Label should appear with ":15".
    firePointer(document, 'pointermove', { pointerType: 'touch', clientX: 50, clientY: 212 });
    const label = el.querySelector('.ec-pager-page-current .ec-sidebar [data-ec-draft-start-label]');
    expect(label).toBeTruthy();
    expect(label.textContent).toBe(':15');

    // +24 px → +30 min → 09:30 → ":30".
    firePointer(document, 'pointermove', { pointerType: 'touch', clientX: 50, clientY: 224 });
    expect(label.textContent).toBe(':30');

    // +36 px → +45 min → 09:45 → ":45".
    firePointer(document, 'pointermove', { pointerType: 'touch', clientX: 50, clientY: 236 });
    expect(label.textContent).toBe(':45');

    // +48 px → +60 min → 10:00 — on the hour. The static "10" / "am"
    // hour label is already in the gutter, so the floating tag is
    // removed.
    firePointer(document, 'pointermove', { pointerType: 'touch', clientX: 50, clientY: 248 });
    expect(el.querySelector('[data-ec-draft-start-label]')).toBeNull();

    firePointer(document, 'pointerup', { pointerType: 'touch', clientX: 50, clientY: 248 });
    expect(el.querySelector('[data-ec-draft-start-label]')).toBeNull();
  });

  it('removes the gutter label on release even when the snap last landed on a quarter-hour', async () => {
    const el = mount(`<div data-controller="calendar"
                            data-calendar-plugins-value='["TimeGrid","Interaction"]'
                            data-calendar-view-value="timeGridDay"
                            data-calendar-date-value="2026-05-25"
                            data-calendar-options-value='{"editable":true,"snapDuration":"00:15:00"}'></div>`);
    await tick(2);
    el.calendarApi.addEvent({ id: 'gl2', title: 'Cleanup', start: '2026-05-25T09:00', end: '2026-05-25T10:00' });
    await tick();

    const chip = el.querySelector('[data-event-id="gl2"]');
    const col = el.querySelector('.ec-time-col[data-date="2026-05-25"]');
    col.getBoundingClientRect = () => ({ top: 100, left: 0, bottom: 1000, right: 390, width: 390, height: 900 });
    document.elementsFromPoint = () => [col];
    chip.classList.add('ec-event-editing');

    firePointer(chip, 'pointerdown', { pointerType: 'touch', clientX: 50, clientY: 200 });
    firePointer(document, 'pointermove', { pointerType: 'touch', clientX: 50, clientY: 212 });
    expect(el.querySelector('[data-ec-draft-start-label]')).toBeTruthy();
    firePointer(document, 'pointerup', { pointerType: 'touch', clientX: 50, clientY: 212 });
    // No stranded labels anywhere in the calendar root.
    expect(el.querySelector('[data-ec-draft-start-label]')).toBeNull();
  });
});
