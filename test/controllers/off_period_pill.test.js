// @vitest-environment happy-dom
//
// Phase E coverage: isOffPeriod() + calendar:offPeriodChange event +
// backToTodayPill rendered into the calendar root when off-period.

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

describe('Phase E — off-period + back-to-today pill', () => {
  beforeEach(() => { document.body.innerHTML = ''; });
  afterEach(() => { app?.stop(); app = null; document.body.innerHTML = ''; });

  it('isOffPeriod is true when the view does not cover today', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-27T10:00:00'));
    try {
      const el = await mount(`<div data-controller="calendar"
        data-calendar-plugins-value='["DayGrid"]'
        data-calendar-view-value="dayGridMonth"
        data-calendar-date-value="2020-01-01"></div>`);
      expect(el.calendarApi.isOffPeriod()).toBe(true);
      el.calendarApi.today();
      expect(el.calendarApi.isOffPeriod()).toBe(false);
    } finally { vi.useRealTimers(); }
  });

  it('offPeriodChange fires when navigating away and back', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-27T10:00:00'));
    try {
      const el = await mount(`<div data-controller="calendar"
        data-calendar-plugins-value='["DayGrid"]'
        data-calendar-view-value="dayGridMonth"
        data-calendar-date-value="2026-05-15"></div>`);
      const events = [];
      el.addEventListener('calendar:offPeriodChange', (e) => events.push(e.detail.offPeriod));
      // Navigate to a far date → off-period
      el.calendarApi.gotoDate('2024-01-01');
      // Navigate back → on-period
      el.calendarApi.today();
      expect(events).toContain(true);
      expect(events).toContain(false);
    } finally { vi.useRealTimers(); }
  });

  it('backToTodayPill renders in the root when off-period', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-27T10:00:00'));
    try {
      const el = await mount(`<div data-controller="calendar"
        data-calendar-plugins-value='["DayGrid"]'
        data-calendar-view-value="dayGridMonth"
        data-calendar-date-value="2020-01-01"
        data-calendar-back-to-today-pill-value="true"></div>`);
      expect(el.querySelector('.ec-back-to-today-pill')).toBeTruthy();
      el.querySelector('.ec-back-to-today-pill').click();
      expect(el.calendarApi.isOffPeriod()).toBe(false);
      expect(el.querySelector('.ec-back-to-today-pill')).toBeNull();
    } finally { vi.useRealTimers(); }
  });
});
