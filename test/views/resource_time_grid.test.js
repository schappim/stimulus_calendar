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

describe('view: resourceTimeGrid', () => {
  beforeEach(() => { document.body.innerHTML = ''; });
  afterEach(() => { app?.stop(); app = null; document.body.innerHTML = ''; });

  it('renders one column per (day × resource) and routes events to their resource', async () => {
    const el = await mount(`<div data-controller="calendar"
      data-calendar-plugins-value='["ResourceTimeGrid"]'
      data-calendar-view-value="resourceTimeGridDay"
      data-calendar-date-value="2026-05-25"
      data-calendar-resources-value='[{"id":"r1","title":"Room A"},{"id":"r2","title":"Room B"}]'>
    </div>`);
    const cols = el.querySelectorAll('[data-grid="resource-time-grid"] .ec-time-col');
    expect(cols.length).toBe(2);
    el.calendarApi.addEvent({
      id:'1', title:'Meeting', start:'2026-05-25T09:00', end:'2026-05-25T10:00',
      resourceIds: ['r1'],
    });
    expect(el.querySelector('[data-resource-id="r1"][data-date] [data-event-id="1"]')).toBeTruthy();
    expect(el.querySelector('[data-resource-id="r2"][data-date] [data-event-id="1"]')).toBeNull();
  });

  it('filterResourcesWithEvents hides resources with no events in range', async () => {
    const el = await mount(`<div data-controller="calendar"
      data-calendar-plugins-value='["ResourceTimeGrid"]'
      data-calendar-view-value="resourceTimeGridDay"
      data-calendar-date-value="2026-05-25"
      data-calendar-resources-value='[{"id":"r1","title":"Used"},{"id":"r2","title":"Unused"}]'>
    </div>`);
    el.calendarApi.setOption('filterResourcesWithEvents', true);
    el.calendarApi.addEvent({
      id:'1', start:'2026-05-25T09:00', end:'2026-05-25T10:00', resourceIds: ['r1'],
    });
    const cols = el.querySelectorAll('[data-grid="resource-time-grid"] .ec-time-col');
    expect(cols.length).toBe(1);
  });

  it('resourceLabelContent override applies the custom label', async () => {
    const el = await mount(`<div data-controller="calendar"
      data-calendar-plugins-value='["ResourceTimeGrid"]'
      data-calendar-view-value="resourceTimeGridDay"
      data-calendar-date-value="2026-05-25"
      data-calendar-resources-value='[{"id":"r1","title":"Room A"}]'>
    </div>`);
    el.calendarApi.setOption('resourceLabelContent', ({ resource }) => `→ ${resource.title}`);
    const label = el.querySelector('[data-resource-label]');
    expect(label.textContent).toBe('→ Room A');
  });
});
