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

  it('renders a group header above grouped resources (Phase A1)', async () => {
    const el = await mount(`<div data-controller="calendar"
      data-calendar-plugins-value='["ResourceTimeline"]'
      data-calendar-view-value="resourceTimelineWeek"
      data-calendar-date-value="2026-05-25"
      data-calendar-resources-value='[
        {"id":"will","title":"Will","crewId":"a"},
        {"id":"mike","title":"Mike","crewId":"a"},
        {"id":"sam","title":"Sam","crewId":"b"},
        {"id":"joe","title":"Joe"}
      ]'
      data-calendar-resource-groups-value='[
        {"id":"a","title":"Crew A","color":"#5856d6","resourceIds":["will","mike"],"expanded":true},
        {"id":"b","title":"Crew B","color":"#34c759","resourceIds":["sam"],"expanded":true}
      ]'>
    </div>`);
    const headers = el.querySelectorAll('[data-row="group-header"]');
    expect(headers.length).toBe(2);
    expect(headers[0].getAttribute('data-group-id')).toBe('a');
    expect(headers[0].querySelector('.ec-group-header-name').textContent).toBe('Crew A');
    expect(headers[0].querySelector('.ec-group-header-count').textContent).toBe('2');
    // Ungrouped resource still rendered at the tail
    expect(el.querySelector('[data-resource-id="joe"]')).toBeTruthy();
  });

  it('collapsing a group hides its members and fires groupCollapse', async () => {
    const el = await mount(`<div data-controller="calendar"
      data-calendar-plugins-value='["ResourceTimeline"]'
      data-calendar-view-value="resourceTimelineWeek"
      data-calendar-date-value="2026-05-25"
      data-calendar-resources-value='[
        {"id":"will","title":"Will"},
        {"id":"mike","title":"Mike"}
      ]'
      data-calendar-resource-groups-value='[
        {"id":"a","title":"Crew A","resourceIds":["will","mike"],"expanded":true}
      ]'>
    </div>`);
    const events = [];
    el.addEventListener('calendar:groupCollapse', (e) => events.push(e.detail));
    el.addEventListener('calendar:groupExpand',   (e) => events.push({ ...e.detail, expand: true }));
    expect(el.querySelector('[data-resource-id="will"]')).toBeTruthy();
    el.querySelector('[data-group-id="a"] .ec-group-header-toggle').click();
    expect(el.querySelector('[data-resource-id="will"]')).toBeNull();
    expect(events.length).toBe(1);
    expect(events[0].groupId).toBe('a');
    // Re-expand via the public API
    el.calendarApi.setGroupExpanded('a', true);
    await new Promise((r) => queueMicrotask(r));
    expect(el.querySelector('[data-resource-id="will"]')).toBeTruthy();
  });

  it('derives groups from resourceGroupField via extendedProps', async () => {
    const el = await mount(`<div data-controller="calendar"
      data-calendar-plugins-value='["ResourceTimeline"]'
      data-calendar-view-value="resourceTimelineWeek"
      data-calendar-date-value="2026-05-25"
      data-calendar-resource-group-field-value="crewId"
      data-calendar-resources-value='[
        {"id":"will","title":"Will","extendedProps":{"crewId":"a","crewIdTitle":"Crew A"}},
        {"id":"mike","title":"Mike","extendedProps":{"crewId":"a","crewIdTitle":"Crew A"}},
        {"id":"sam","title":"Sam","extendedProps":{"crewId":"b","crewIdTitle":"Crew B"}}
      ]'>
    </div>`);
    const headers = el.querySelectorAll('[data-row="group-header"]');
    expect(headers.length).toBe(2);
    expect(headers[0].querySelector('.ec-group-header-name').textContent).toBe('Crew A');
    expect(el.calendarApi.getResourceGroups().length).toBe(2);
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
