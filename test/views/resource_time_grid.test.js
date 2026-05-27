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

  it('paints .ec-resource-offhours bands outside workingHours per resource (S6)', async () => {
    // 2026-05-25 is Monday. Justin is 07:00–16:00 Mon–Sat; Kobe is
    // 09:00–17:00 Mon–Fri. Both lanes should get top + bottom bands,
    // sized differently.
    const resources = [
      { id: 'justin', title: 'Justin',
        workingHours: { daysOfWeek: [1,2,3,4,5,6], start: '07:00', end: '16:00' }},
      { id: 'kobe',   title: 'Kobe',
        workingHours: { daysOfWeek: [1,2,3,4,5], start: '09:00', end: '17:00' }},
    ];
    const el = await mount(`<div data-controller="calendar"
      data-calendar-plugins-value='["ResourceTimeGrid"]'
      data-calendar-view-value="resourceTimeGridDay"
      data-calendar-date-value="2026-05-25"
      data-calendar-resources-value='${JSON.stringify(resources)}'></div>`);
    const justinCol = el.querySelector('[data-resource-id="justin"][data-date="2026-05-25"]');
    const kobeCol   = el.querySelector('[data-resource-id="kobe"][data-date="2026-05-25"]');
    expect(justinCol).toBeTruthy();
    expect(kobeCol).toBeTruthy();
    const jBands = justinCol.querySelectorAll('.ec-resource-offhours');
    const kBands = kobeCol.querySelectorAll('.ec-resource-offhours');
    // Two bands per lane: pre-open + post-close (working day).
    expect(jBands.length).toBe(2);
    expect(kBands.length).toBe(2);
  });

  it('omits the off-hours band when no workingHours is declared on the resource (S6)', async () => {
    const el = await mount(`<div data-controller="calendar"
      data-calendar-plugins-value='["ResourceTimeGrid"]'
      data-calendar-view-value="resourceTimeGridDay"
      data-calendar-date-value="2026-05-25"
      data-calendar-resources-value='[{"id":"r1","title":"Room A"}]'></div>`);
    const col = el.querySelector('[data-resource-id="r1"][data-date="2026-05-25"]');
    expect(col.querySelectorAll('.ec-resource-offhours').length).toBe(0);
  });

  it('paints a full-day band on a closed day (Sunday for a Mon–Fri resource) (S6)', async () => {
    // 2026-05-24 is Sunday.
    const resources = [
      { id: 'kobe', title: 'Kobe',
        workingHours: { daysOfWeek: [1,2,3,4,5], start: '09:00', end: '17:00' }},
    ];
    const el = await mount(`<div data-controller="calendar"
      data-calendar-plugins-value='["ResourceTimeGrid"]'
      data-calendar-view-value="resourceTimeGridDay"
      data-calendar-date-value="2026-05-24"
      data-calendar-resources-value='${JSON.stringify(resources)}'></div>`);
    const col = el.querySelector('[data-resource-id="kobe"][data-date="2026-05-24"]');
    const bands = col.querySelectorAll('.ec-resource-offhours');
    expect(bands.length).toBe(1);
  });

  it('passes extendedProps.dataAttrs through to data-* on a resourceTimeGrid chip', async () => {
    const el = await mount(`<div data-controller="calendar"
      data-calendar-plugins-value='["ResourceTimeGrid"]'
      data-calendar-view-value="resourceTimeGridDay"
      data-calendar-date-value="2026-05-25"
      data-calendar-resources-value='[{"id":"r1","title":"Room A"}]'>
    </div>`);
    el.calendarApi.addEvent({
      id: 'appt-42',
      title: 'Switchboard upgrade',
      start: '2026-05-25T09:00',
      end: '2026-05-25T11:00',
      resourceIds: ['r1'],
      extendedProps: { dataAttrs: { aiContextType: 'job', jobId: 1042 } },
    });
    const chip = el.querySelector('[data-event-id="appt-42"]');
    expect(chip).toBeTruthy();
    expect(chip.getAttribute('data-ai-context-type')).toBe('job');
    expect(chip.getAttribute('data-job-id')).toBe('1042');
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

  it('--ec-cols on the root spans (days × resources) so header columns align with the body day columns', async () => {
    // Five resources × one day = five columns in the body. The header's
    // grid-template-columns falls back to 7 when --ec-cols is unset on an
    // ancestor — that left the 5 resource-name cells laid out as 5-of-7
    // tracks (~71% of the row), while the body filled the full width with
    // 5 tracks. Setting --ec-cols on the root cascades to both.
    const resources = ['r1','r2','r3','r4','r5'].map(
      (id) => ({ id, title: id.toUpperCase() })
    );
    const el = await mount(`<div data-controller="calendar"
      data-calendar-plugins-value='["ResourceTimeGrid"]'
      data-calendar-view-value="resourceTimeGridDay"
      data-calendar-date-value="2026-05-25"
      data-calendar-resources-value='${JSON.stringify(resources)}'>
    </div>`);
    const root = el.querySelector('[data-grid="resource-time-grid"]');
    expect(root.style.getPropertyValue('--ec-cols')).toBe('5');
    const heads = root.querySelectorAll('[data-row="header"] [data-resource-id]');
    const cols  = root.querySelectorAll('[data-row="body"] .ec-time-col');
    expect(heads.length).toBe(cols.length);
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
