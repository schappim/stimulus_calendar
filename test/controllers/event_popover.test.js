// @vitest-environment happy-dom
//
// Coverage for the event popover — opened by double-clicking a chip in
// any view, programmatic open/close, edit/delete callbacks, suppression
// via options.suppressEventPopover, and via event.preventDefault().

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

async function mountWithEvent(view = 'DayGrid', date = '2026-05-15') {
  const el = mount(`<div data-controller="calendar"
                          data-calendar-plugins-value='["${view}"]'
                          data-calendar-date-value="${date}"></div>`);
  await tick();
  el.calendarApi.addEvent({
    id: 'e1', title: 'Design crit',
    start: `${date}T14:00`, end: `${date}T15:30`,
    extendedProps: { category: 'design', description: 'Review the new layout proposals' },
  });
  await tick();
  return el;
}

const dblclickOn = async (target) => {
  // happy-dom doesn't auto-synthesise dblclick from two clicks — fire it explicitly.
  target.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true }));
  // The controller defers opening to a microtask so user listeners can preventDefault.
  await tick();
};

describe('Event popover', () => {
  beforeEach(() => { document.body.innerHTML = ''; });
  afterEach(() => { app?.stop(); app = null; vi.restoreAllMocks(); });

  it('opens on chip dblclick in DayGrid', async () => {
    const el = await mountWithEvent('DayGrid');
    const chip = el.querySelector('[data-event-id="e1"]');
    expect(chip).toBeTruthy();
    await dblclickOn(chip);
    const pop = document.querySelector('.ec-event-popover');
    expect(pop).toBeTruthy();
    expect(pop.textContent).toContain('Design crit');
    expect(pop.textContent).toContain('Review the new layout');
    expect(pop.textContent).toContain('Category');
  });

  it('opens on chip dblclick in TimeGrid', async () => {
    const el = await mountWithEvent('TimeGrid', '2026-05-25');
    const chip = el.querySelector('[data-event-id="e1"]');
    await dblclickOn(chip);
    expect(document.querySelector('.ec-event-popover')).toBeTruthy();
  });

  it('opens on row dblclick in List', async () => {
    const el = await mountWithEvent('List', '2026-05-25');
    const row = el.querySelector('[data-event-id="e1"]');
    await dblclickOn(row);
    expect(document.querySelector('.ec-event-popover')).toBeTruthy();
  });

  it('Close (×) button removes the popover', async () => {
    const el = await mountWithEvent();
    await dblclickOn(el.querySelector('[data-event-id="e1"]'));
    document.querySelector('.ec-event-popover-close').click();
    expect(document.querySelector('.ec-event-popover')).toBeNull();
  });

  it('Edit / Delete buttons fire DOM events + close popover', async () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const el = await mountWithEvent();
    el.addEventListener('calendar:eventPopoverEdit', onEdit);
    el.addEventListener('calendar:eventPopoverDelete', onDelete);
    await dblclickOn(el.querySelector('[data-event-id="e1"]'));

    document.querySelector('[data-popover-action="edit"]').click();
    expect(onEdit).toHaveBeenCalled();
    expect(document.querySelector('.ec-event-popover')).toBeNull();

    await dblclickOn(el.querySelector('[data-event-id="e1"]'));
    document.querySelector('[data-popover-action="delete"]').click();
    expect(onDelete).toHaveBeenCalled();
    expect(document.querySelector('.ec-event-popover')).toBeNull();
  });

  it('options.suppressEventPopover skips auto-open', async () => {
    const el = await mountWithEvent();
    el.calendarApi.setOption('suppressEventPopover', true);
    await dblclickOn(el.querySelector('[data-event-id="e1"]'));
    expect(document.querySelector('.ec-event-popover')).toBeNull();
  });

  it('event.preventDefault() inside calendar:eventDoubleClick suppresses auto-open', async () => {
    const el = await mountWithEvent();
    el.addEventListener('calendar:eventDoubleClick', (ev) => ev.preventDefault());
    await dblclickOn(el.querySelector('[data-event-id="e1"]'));
    await tick();
    expect(document.querySelector('.ec-event-popover')).toBeNull();
  });

  it('calendarApi.openEventPopover(id) opens programmatically', async () => {
    const el = await mountWithEvent();
    el.calendarApi.openEventPopover('e1');
    expect(document.querySelector('.ec-event-popover')).toBeTruthy();
    el.calendarApi.closeEventPopover();
    expect(document.querySelector('.ec-event-popover')).toBeNull();
  });

  it('isEventPopoverOpen / openEventPopoverId reflect state', async () => {
    const el = await mountWithEvent();
    expect(el.calendarApi.isEventPopoverOpen()).toBe(false);
    el.calendarApi.openEventPopover('e1');
    expect(el.calendarApi.isEventPopoverOpen()).toBe(true);
    expect(el.calendarApi.openEventPopoverId()).toBe('e1');
    el.calendarApi.closeEventPopover();
    expect(el.calendarApi.isEventPopoverOpen()).toBe(false);
  });

  it('Escape closes the popover', async () => {
    const el = await mountWithEvent();
    await dblclickOn(el.querySelector('[data-event-id="e1"]'));
    expect(document.querySelector('.ec-event-popover')).toBeTruthy();
    await tick(2); // outside-click + escape listeners attach next tick
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(document.querySelector('.ec-event-popover')).toBeNull();
  });
});
