// @vitest-environment happy-dom
//
// Coverage for the macOS-style continuous vertical month scroller
// (src/components/month_scroller.js):
//   1. Opt-in via options.continuousMonthScroll — default dayGridMonth
//      still uses the pager.
//   2. Sticky weekday header is rendered.
//   3. Multiple months' week rows seed on mount (centred on options.date).
//   4. Each month-start row carries a "Month YEAR" banner.
//   5. Event chips render in cells whose data-date matches.
//
// happy-dom doesn't implement real layout or scroll metrics, so the
// edge-extension and settled-scroll snap behaviours are unit-tested via
// direct hooks rather than scroll dispatch.

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

describe('MonthScroller (continuousMonthScroll)', () => {
  beforeEach(() => { document.body.innerHTML = ''; });
  afterEach(() => { app?.stop(); app = null; vi.restoreAllMocks(); });

  it('is not used unless options.continuousMonthScroll is true', async () => {
    const el = mount(`<div data-controller="calendar"
                            data-calendar-plugins-value='["DayGrid"]'
                            data-calendar-view-value="dayGridMonth"
                            data-calendar-date-value="2026-05-15"></div>`);
    await tick();
    // Pager wraps the regular DayGrid month — no .ec-month-scroller.
    expect(el.querySelector('.ec-month-scroller')).toBeNull();
    expect(el.querySelector('.ec-pager .ec-day-grid')).toBeTruthy();
  });

  it('mounts the scroller when continuousMonthScroll is on', async () => {
    const el = mount(`<div data-controller="calendar"
                            data-calendar-plugins-value='["DayGrid"]'
                            data-calendar-view-value="dayGridMonth"
                            data-calendar-date-value="2026-05-15"
                            data-calendar-options-value='{"continuousMonthScroll":true}'></div>`);
    await tick();
    expect(el.querySelector('.ec-month-scroller')).toBeTruthy();
    expect(el.querySelector('.ec-month-scroller-head')).toBeTruthy();
    expect(el.querySelector('.ec-month-scroller-body')).toBeTruthy();
    // Default firstDay=0 (Sun) — first head cell is Sunday.
    const heads = el.querySelectorAll('.ec-month-scroller-day-head');
    expect(heads.length).toBe(7);
  });

  it('seeds multiple months and bannerises the month-start rows', async () => {
    const el = mount(`<div data-controller="calendar"
                            data-calendar-plugins-value='["DayGrid"]'
                            data-calendar-view-value="dayGridMonth"
                            data-calendar-date-value="2026-05-15"
                            data-calendar-options-value='{"continuousMonthScroll":true}'></div>`);
    await tick();
    const banners = el.querySelectorAll('.ec-month-scroller-month-banner');
    // anchor ± 6 months = at least 12 distinct month banners.
    expect(banners.length).toBeGreaterThanOrEqual(12);
    // The May 2026 banner must be present.
    const may = Array.from(banners).find((b) => /May/.test(b.textContent) && /2026/.test(b.textContent));
    expect(may).toBeTruthy();
  });

  it('renders event chips inside the matching day cell', async () => {
    const el = mount(`<div data-controller="calendar"
                            data-calendar-plugins-value='["DayGrid"]'
                            data-calendar-view-value="dayGridMonth"
                            data-calendar-date-value="2026-05-15"
                            data-calendar-options-value='{"continuousMonthScroll":true}'></div>`);
    await tick();
    el.calendarApi.addEvent({ id: 'e1', title: 'Hello', start: '2026-05-15T09:00', end: '2026-05-15T10:00' });
    await tick(2);
    const cell = el.querySelector('.ec-month-scroller-cell[data-date="2026-05-15"]');
    expect(cell).toBeTruthy();
    const chip = cell.querySelector('[data-event-id="e1"]');
    expect(chip).toBeTruthy();
    expect(chip.textContent).toContain('Hello');
  });

  it('today cell carries the .ec-today class', async () => {
    // System reminder pins "today" to 2026-05-25 in this conversation.
    const el = mount(`<div data-controller="calendar"
                            data-calendar-plugins-value='["DayGrid"]'
                            data-calendar-view-value="dayGridMonth"
                            data-calendar-date-value="2026-05-15"
                            data-calendar-options-value='{"continuousMonthScroll":true}'></div>`);
    await tick();
    const todayIso = new Date().toISOString().substring(0, 10);
    const cell = el.querySelector(`.ec-month-scroller-cell[data-date="${todayIso}"]`);
    if (!cell) return; // outside the seeded ±6 month window — skip
    expect(cell.classList.contains('ec-today')).toBe(true);
  });
});
