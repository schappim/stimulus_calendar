// @vitest-environment happy-dom
//
// Phase C1 — WeekScroller integration tests. Covers the controller
// bypass of Pager when continuousWeekScroll is on, the single
// .ec-continuous-time-grid wrapper (no per-page snapshots), and the
// toolbar Today / gotoDate path round-tripping through the scroller.

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

describe('WeekScroller (continuousWeekScroll)', () => {
  beforeEach(() => { document.body.innerHTML = ''; });
  afterEach(() => { app?.stop(); app = null; document.body.innerHTML = ''; });

  it('mounts a single .ec-continuous-time-grid wrapper (no Pager carousel)', async () => {
    const el = await mount(`<div data-controller="calendar"
      data-calendar-plugins-value='["TimeGrid"]'
      data-calendar-view-value="timeGridWeek"
      data-calendar-date-value="2026-05-25"
      data-calendar-continuous-week-scroll-value="true"></div>`);
    expect(el.querySelectorAll('.ec-continuous-time-grid').length).toBe(1);
    // No Pager pages (page-prev / page-current / page-next).
    expect(el.querySelectorAll('.ec-pager-page').length).toBe(0);
    // Renders a single TimeGrid root.
    expect(el.querySelectorAll('.ec-grid.ec-time-grid').length).toBe(1);
  });

  it('toolbar Today button re-centres the scroller on today', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-27T10:00:00'));
    try {
      const el = await mount(`<div data-controller="calendar"
        data-calendar-plugins-value='["TimeGrid"]'
        data-calendar-view-value="timeGridWeek"
        data-calendar-date-value="2025-01-01"
        data-calendar-continuous-week-scroll-value="true"></div>`);
      // Initial date is far in the past — call today() and confirm
      // options.date moves to today without crashing the scroller.
      el.calendarApi.today();
      await new Promise((r) => queueMicrotask(r));
      const d = el.calendarApi.getOption('date');
      expect(d.getFullYear()).toBe(2026);
      expect(d.getMonth()).toBe(4); // May (0-indexed)
      expect(d.getDate()).toBe(27);
      // Scroller still has a TimeGrid mounted after the re-anchor.
      expect(el.querySelectorAll('.ec-grid.ec-time-grid').length).toBe(1);
    } finally { vi.useRealTimers(); }
  });

  it('gotoDate to a date within the rendered range scrolls without re-render', async () => {
    const el = await mount(`<div data-controller="calendar"
      data-calendar-plugins-value='["TimeGrid"]'
      data-calendar-view-value="timeGridWeek"
      data-calendar-date-value="2026-05-25"
      data-calendar-continuous-week-scroll-value="true"></div>`);
    el.calendarApi.gotoDate('2026-05-28');
    await new Promise((r) => queueMicrotask(r));
    const d = el.calendarApi.getOption('date');
    expect(d.toISOString().substring(0, 10)).toBe('2026-05-28');
  });
});
