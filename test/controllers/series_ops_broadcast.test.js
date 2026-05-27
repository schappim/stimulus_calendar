// @vitest-environment happy-dom
//
// S2 — series-aware Turbo Stream ops end-to-end through the calendar
// controller's broadcast subscription. We bypass the Turbo Streams DOM
// pipeline and publish directly through the controller's broadcast bus
// (same `_applyBroadcast(message)` code path either way).

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

function controllerFor(el, app) {
  return app.getControllerForElementAndIdentifier(el, 'calendar');
}

describe('controller — series-aware broadcast ops', () => {
  beforeEach(() => { document.body.innerHTML = ''; });
  afterEach(() => { app?.stop(); app = null; });

  it('skip-occurrence removes the matching (seriesId, date) occurrence from local state', async () => {
    const el = await mount(`<div data-controller="calendar"
      data-calendar-plugins-value='["DayGrid"]'
      data-calendar-date-value="2026-06-15"></div>`);
    el.calendarApi.addEvent({
      id: 'master-42-2026-06-09', title: 'Stand-up',
      start: '2026-06-09T09:00', end: '2026-06-09T09:30',
      extendedProps: { series: { id: 'master-42', instance: 2 } },
    });
    el.calendarApi.addEvent({
      id: 'master-42-2026-06-16', title: 'Stand-up',
      start: '2026-06-16T09:00', end: '2026-06-16T09:30',
      extendedProps: { series: { id: 'master-42', instance: 3 } },
    });
    el.calendarApi.addEvent({
      id: 'unrelated', title: 'Other',
      start: '2026-06-09T11:00', end: '2026-06-09T11:30',
    });
    await tick();

    const ctrl = controllerFor(el, app);
    const onSkipped = vi.fn();
    el.addEventListener('calendar:seriesOccurrenceSkipped', (ev) => onSkipped(ev.detail));

    ctrl._applyBroadcast({
      op: 'skip-occurrence', seriesId: 'master-42', date: '2026-06-09',
    });
    await tick();

    expect(el.calendarApi.getEventById('master-42-2026-06-09')).toBeUndefined();
    // Other occurrences and unrelated events untouched.
    expect(el.calendarApi.getEventById('master-42-2026-06-16')).toBeTruthy();
    expect(el.calendarApi.getEventById('unrelated')).toBeTruthy();
    expect(onSkipped).toHaveBeenCalledWith({ seriesId: 'master-42', date: '2026-06-09' });
  });

  it('override-occurrence patches the matching (seriesId, date) occurrence', async () => {
    const el = await mount(`<div data-controller="calendar"
      data-calendar-plugins-value='["DayGrid"]'
      data-calendar-date-value="2026-06-15"></div>`);
    el.calendarApi.addEvent({
      id: 'master-42-2026-06-09', title: 'Stand-up',
      start: '2026-06-09T09:00', end: '2026-06-09T09:30',
      extendedProps: { series: { id: 'master-42', instance: 2 } },
    });
    el.calendarApi.addEvent({
      id: 'master-42-2026-06-16', title: 'Stand-up',
      start: '2026-06-16T09:00', end: '2026-06-16T09:30',
      extendedProps: { series: { id: 'master-42', instance: 3 } },
    });
    await tick();

    const ctrl = controllerFor(el, app);
    const onOverridden = vi.fn();
    el.addEventListener('calendar:seriesOccurrenceOverridden', (ev) => onOverridden(ev.detail));

    ctrl._applyBroadcast({
      op: 'override-occurrence',
      seriesId: 'master-42',
      date: '2026-06-09',
      overrides: { title: 'Special site visit' },
    });
    await tick();

    const patched = el.calendarApi.getEventById('master-42-2026-06-09');
    expect(patched.title).toBe('Special site visit');
    // The other occurrence keeps its original title.
    expect(el.calendarApi.getEventById('master-42-2026-06-16').title).toBe('Stand-up');
    expect(onOverridden).toHaveBeenCalled();
    expect(onOverridden.mock.calls[0][0].seriesId).toBe('master-42');
    expect(onOverridden.mock.calls[0][0].date).toBe('2026-06-09');
  });

  it('skip-occurrence is a no-op when nothing matches (silently)', async () => {
    const el = await mount(`<div data-controller="calendar"
      data-calendar-plugins-value='["DayGrid"]'
      data-calendar-date-value="2026-06-15"></div>`);
    el.calendarApi.addEvent({
      id: 'one-off', title: 'One-off',
      start: '2026-06-09T09:00', end: '2026-06-09T09:30',
    });
    await tick();

    const ctrl = controllerFor(el, app);
    const onSkipped = vi.fn();
    el.addEventListener('calendar:seriesOccurrenceSkipped', (ev) => onSkipped(ev.detail));

    ctrl._applyBroadcast({
      op: 'skip-occurrence', seriesId: 'nonexistent', date: '2026-06-09',
    });
    await tick();

    expect(el.calendarApi.getEventById('one-off')).toBeTruthy();
    expect(onSkipped).not.toHaveBeenCalled();
  });
});
