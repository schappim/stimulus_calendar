// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
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

describe('toolbar', () => {
  beforeEach(() => { document.body.innerHTML = ''; });
  afterEach(() => { app?.stop(); app = null; document.body.innerHTML = ''; });

  it('renders the view title in an <h2> inside the toolbar slot', async () => {
    const el = await mount(
      `<div data-controller="calendar" data-calendar-date-value="2026-05-25"></div>`);
    const title = el.querySelector('[data-calendar-slot="toolbar"] h2');
    expect(title).toBeTruthy();
    expect(title.className).toBe('ec-title');
    // The exact string depends on locale, but it should contain the year.
    expect(title.textContent).toContain('2026');
  });

  it('updates the title when navigating via next()', async () => {
    const el = await mount(
      `<div data-controller="calendar" data-calendar-date-value="2026-05-25"></div>`);
    const before = el.querySelector('[data-calendar-slot="toolbar"] h2').textContent;
    el.calendarApi.next();
    const after = el.querySelector('[data-calendar-slot="toolbar"] h2').textContent;
    expect(after).not.toBe(before);
  });
});
