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
});
