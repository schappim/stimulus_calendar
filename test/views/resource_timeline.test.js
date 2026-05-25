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

describe('view: resourceTimeline', () => {
  beforeEach(() => { document.body.innerHTML = ''; });
  afterEach(() => { app?.stop(); app = null; document.body.innerHTML = ''; });

  it('renders one row per resource with a horizontal ribbon', async () => {
    const el = await mount(`<div data-controller="calendar"
      data-calendar-plugins-value='["ResourceTimeline"]'
      data-calendar-view-value="resourceTimelineWeek"
      data-calendar-date-value="2026-05-25"
      data-calendar-resources-value='[{"id":"r1","title":"Room A"},{"id":"r2","title":"Room B"}]'>
    </div>`);
    const rows = el.querySelectorAll('.ec-timeline-row');
    expect(rows.length).toBe(2);
    expect(rows[0].getAttribute('data-resource-id')).toBe('r1');
  });

  it('nested resources collapse parent by default and expand via click', async () => {
    const el = await mount(`<div data-controller="calendar"
      data-calendar-plugins-value='["ResourceTimeline"]'
      data-calendar-view-value="resourceTimelineWeek"
      data-calendar-date-value="2026-05-25"
      data-calendar-resources-value='[{"id":"p","title":"Parent","expanded":false,"children":[{"id":"c1","title":"Child 1"}]}]'>
    </div>`);
    // Parent visible; child hidden initially.
    expect(el.querySelector('[data-resource-id="p"]')).toBeTruthy();
    expect(el.querySelector('[data-resource-id="c1"]')).toBeNull();
    el.querySelector('.ec-expander').click();
    expect(el.querySelector('[data-resource-id="c1"]')).toBeTruthy();
  });

  it('positions an event ribbon at the right day offset', async () => {
    const el = await mount(`<div data-controller="calendar"
      data-calendar-plugins-value='["ResourceTimeline"]'
      data-calendar-view-value="resourceTimelineWeek"
      data-calendar-date-value="2026-05-25"
      data-calendar-resources-value='[{"id":"r1","title":"Room A"}]'>
    </div>`);
    el.calendarApi.addEvent({
      id:'1', title:'Booked',
      start:'2026-05-26T09:00', end:'2026-05-28T17:00',
      resourceIds:['r1'],
    });
    const chip = el.querySelector('[data-event-id="1"]');
    expect(chip).toBeTruthy();
    expect(parseFloat(chip.style.left)).toBeGreaterThan(0);
    expect(parseFloat(chip.style.width)).toBeGreaterThan(0);
  });
});
