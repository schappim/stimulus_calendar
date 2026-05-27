// @vitest-environment happy-dom
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

describe('view: resourceTimeline', () => {
  beforeEach(() => { document.body.innerHTML = ''; });
  afterEach(() => { app?.stop(); app = null; document.body.innerHTML = ''; });

  it('day-header row carries the sticky/header attribute (Phase A2)', async () => {
    const el = await mount(`<div data-controller="calendar"
      data-calendar-plugins-value='["ResourceTimeline"]'
      data-calendar-view-value="resourceTimelineWeek"
      data-calendar-date-value="2026-05-25"
      data-calendar-resources-value='[{"id":"r1","title":"Room A"}]'>
    </div>`);
    const header = el.querySelector('.ec-timeline [data-row="header"]');
    expect(header).toBeTruthy();
    // The renderer leaves the actual sticky-positioning to CSS, but we
    // assert the marker is present and the row-head spacer (the
    // bottom-left corner) is the very first child so it can lock to
    // top-left under the sticky cascade.
    expect(header.firstElementChild?.classList?.contains('ec-row-head')).toBe(true);
  });

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

  it('fires calendar:cellClick with { date, resource, group } (Phase A3)', async () => {
    const el = await mount(`<div data-controller="calendar"
      data-calendar-plugins-value='["ResourceTimeline"]'
      data-calendar-view-value="resourceTimelineWeek"
      data-calendar-date-value="2026-05-25"
      data-calendar-empty-cell-add-button-value="true"
      data-calendar-resources-value='[{"id":"will","title":"Will"}]'
      data-calendar-resource-groups-value='[
        {"id":"a","title":"Crew A","resourceIds":["will"],"expanded":true}
      ]'>
    </div>`);
    const cells = el.querySelectorAll('.ec-timeline-cell');
    // 7-day week
    expect(cells.length).toBe(7);
    // emptyCellAddButton true → every cell carries the `+` glyph
    expect(cells[0].querySelector('.ec-timeline-cell-add')).toBeTruthy();

    const events = [];
    el.addEventListener('calendar:cellClick', (e) => events.push(e.detail));
    cells[2].click();
    expect(events.length).toBe(1);
    expect(events[0].resource.id).toBe('will');
    expect(events[0].group?.id).toBe('a');
    expect(events[0].date).toBeInstanceOf(Date);
    expect(cells[2].getAttribute('data-date')).toBe(events[0].date.toISOString().substring(0,10));
  });

  it('omits the + glyph when emptyCellAddButton is off but still fires cellClick', async () => {
    const el = await mount(`<div data-controller="calendar"
      data-calendar-plugins-value='["ResourceTimeline"]'
      data-calendar-view-value="resourceTimelineWeek"
      data-calendar-date-value="2026-05-25"
      data-calendar-resources-value='[{"id":"will","title":"Will"}]'>
    </div>`);
    const cells = el.querySelectorAll('.ec-timeline-cell');
    expect(cells[0].querySelector('.ec-timeline-cell-add')).toBeNull();
    const events = [];
    el.addEventListener('calendar:cellClick', (e) => events.push(e.detail));
    cells[0].click();
    expect(events.length).toBe(1);
    expect(events[0].group).toBeNull();
  });

  it('renders the today band when today falls inside the range (Phase A4)', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-27T10:00:00'));
    try {
      const el = await mount(`<div data-controller="calendar"
        data-calendar-plugins-value='["ResourceTimeline"]'
        data-calendar-view-value="resourceTimelineWeek"
        data-calendar-date-value="2026-05-25"
        data-calendar-resources-value='[{"id":"r1","title":"Room A"}]'>
      </div>`);
      const band = el.querySelector('[data-today-band]');
      expect(band).toBeTruthy();
    } finally {
      vi.useRealTimers();
    }
  });

  it('paints the NOW vertical line only when nowIndicator is on (Phase A4)', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-27T10:00:00'));
    try {
      const offEl = await mount(`<div data-controller="calendar"
        data-calendar-plugins-value='["ResourceTimeline"]'
        data-calendar-view-value="resourceTimelineWeek"
        data-calendar-date-value="2026-05-25"
        data-calendar-resources-value='[{"id":"r1","title":"Room A"}]'>
      </div>`);
      expect(offEl.querySelector('[data-now-indicator]')).toBeNull();
      app?.stop(); app = null; document.body.innerHTML = '';
      const onEl = await mount(`<div data-controller="calendar"
        data-calendar-plugins-value='["ResourceTimeline"]'
        data-calendar-view-value="resourceTimelineWeek"
        data-calendar-date-value="2026-05-25"
        data-calendar-options-value='{"nowIndicator":true}'
        data-calendar-resources-value='[{"id":"r1","title":"Room A"}]'>
      </div>`);
      const line = onEl.querySelector('[data-now-indicator]');
      expect(line).toBeTruthy();
      // Anchored inside the body (not on a row), so the vertical span
      // reaches across every crew row.
      expect(line.parentElement.getAttribute('data-row')).toBe('body');
    } finally {
      vi.useRealTimers();
    }
  });

  it('applies ec-event-narrow when a bar is below eventNarrowThreshold (Phase A7)', async () => {
    const el = await mount(`<div data-controller="calendar"
      data-calendar-plugins-value='["ResourceTimeline"]'
      data-calendar-view-value="resourceTimelineWeek"
      data-calendar-date-value="2026-05-25"
      data-calendar-options-value='{"slotWidth":40,"eventNarrowThreshold":60}'
      data-calendar-resources-value='[{"id":"r1","title":"Room A"}]'>
    </div>`);
    el.calendarApi.addEvent({
      id:'thin', title:'Hi', resourceIds:['r1'],
      start:'2026-05-26', end:'2026-05-27', allDay:true,
    });
    const thin = el.querySelector('[data-event-id="thin"]');
    expect(thin.classList.contains('ec-event-narrow')).toBe(true);

    el.calendarApi.addEvent({
      id:'wide', title:'Multi day', resourceIds:['r1'],
      start:'2026-05-25', end:'2026-05-30', allDay:true,
    });
    const wide = el.querySelector('[data-event-id="wide"]');
    expect(wide.classList.contains('ec-event-narrow')).toBe(false);
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
