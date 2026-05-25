// @vitest-environment happy-dom
//
// One assertion per option — verifies that data-calendar-<name>-value
// flows through to the live options object after connect. Each Phase 3
// option commit adds its assertion below.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Application } from '@hotwired/stimulus';
import CalendarController from '../../src/controllers/calendar_controller.js';

let app;
async function mount(html) {
  document.body.innerHTML = html;
  app = Application.start();
  app.register('calendar', CalendarController);
  // Stimulus uses MutationObserver — let it flush.
  await new Promise((r) => queueMicrotask(r));
  await new Promise((r) => queueMicrotask(r));
  return document.querySelector('[data-controller~="calendar"]');
}

describe('CalendarController options', () => {
  beforeEach(() => { document.body.innerHTML = ''; });
  afterEach(() => { app?.stop(); app = null; document.body.innerHTML = ''; });

  it('view — data-calendar-view-value sets options.view', async () => {
    const el = await mount(
      `<div data-controller="calendar" data-calendar-view-value="timeGridWeek"></div>`);
    expect(el.calendarApi.getOption('view')).toBe('timeGridWeek');
  });

  it('date — data-calendar-date-value parses to a Date at UTC midnight', async () => {
    const el = await mount(
      `<div data-controller="calendar" data-calendar-date-value="2026-05-25"></div>`);
    const date = el.calendarApi.getOption('date');
    expect(date instanceof Date).toBe(true);
    expect(date.getUTCFullYear()).toBe(2026);
    expect(date.getUTCMonth()).toBe(4);
    expect(date.getUTCDate()).toBe(25);
    expect(date.getUTCHours()).toBe(0);
  });

  it('duration — data-calendar-duration-value parses through createDuration', async () => {
    const el = await mount(
      `<div data-controller="calendar" data-calendar-duration-value='{"days":3}'></div>`);
    expect(el.calendarApi.getOption('duration')).toEqual({
      years: 0, months: 0, days: 3, seconds: 0, inWeeks: false,
    });
  });

  it('dateIncrement — data-calendar-date-increment-value parses through createDuration', async () => {
    const el = await mount(
      `<div data-controller="calendar" data-calendar-date-increment-value='{"weeks":2}'></div>`);
    expect(el.calendarApi.getOption('dateIncrement')).toEqual({
      years: 0, months: 0, days: 14, seconds: 0, inWeeks: true,
    });
  });

  it('firstDay — data-calendar-first-day-value sets options.firstDay', async () => {
    const el = await mount(
      `<div data-controller="calendar" data-calendar-first-day-value="1"></div>`);
    expect(el.calendarApi.getOption('firstDay')).toBe(1);
  });
});
