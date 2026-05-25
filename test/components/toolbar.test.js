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

const slot = (el, name) => el.querySelector(`[data-toolbar-slot="${name}"]`);

describe('toolbar', () => {
  beforeEach(() => { document.body.innerHTML = ''; });
  afterEach(() => { app?.stop(); app = null; document.body.innerHTML = ''; });

  it('renders the title token in an <h2>', async () => {
    const el = await mount(
      `<div data-controller="calendar" data-calendar-date-value="2026-05-25"></div>`);
    const title = el.querySelector('h2.ec-title');
    expect(title).toBeTruthy();
    expect(title.textContent).toContain('2026');
  });

  it('updates the title when navigating via next()', async () => {
    const el = await mount(
      `<div data-controller="calendar" data-calendar-date-value="2026-05-25"></div>`);
    const before = el.querySelector('h2.ec-title').textContent;
    el.calendarApi.next();
    const after = el.querySelector('h2.ec-title').textContent;
    expect(after).not.toBe(before);
  });

  it('renders the prev button when the headerToolbar includes the token', async () => {
    const el = await mount(`<div data-controller="calendar"
      data-calendar-header-toolbar-value='{"start":"prev","center":"title","end":""}'>
    </div>`);
    const btn = el.querySelector('[data-toolbar-action="prev"]');
    expect(btn).toBeTruthy();
    expect(btn.tagName).toBe('BUTTON');
    expect(btn.getAttribute('aria-label')).toBe('Previous');
  });

  it('prev button click invokes calendarApi.prev', async () => {
    const el = await mount(`<div data-controller="calendar"
      data-calendar-date-value="2026-05-25"
      data-calendar-header-toolbar-value='{"start":"prev","center":"title","end":""}'>
    </div>`);
    const before = el.calendarApi.getOption('date').getTime();
    el.querySelector('[data-toolbar-action="prev"]').click();
    const after = el.calendarApi.getOption('date').getTime();
    expect(after).toBeLessThan(before);
  });

  it('renders start/center/end slots regardless of layout contents', async () => {
    const el = await mount('<div data-controller="calendar"></div>');
    expect(slot(el, 'start')).toBeTruthy();
    expect(slot(el, 'center')).toBeTruthy();
    expect(slot(el, 'end')).toBeTruthy();
  });

  it('next button click invokes calendarApi.next', async () => {
    const el = await mount(`<div data-controller="calendar"
      data-calendar-date-value="2026-05-25"
      data-calendar-header-toolbar-value='{"start":"prev,next","center":"title","end":""}'>
    </div>`);
    const before = el.calendarApi.getOption('date').getTime();
    el.querySelector('[data-toolbar-action="next"]').click();
    const after = el.calendarApi.getOption('date').getTime();
    expect(after).toBeGreaterThan(before);
  });
});
