// @vitest-environment happy-dom
//
// Coverage for the public calendarApi methods that previously shipped as
// stubs (refetchEvents, refetchResources, unselect, dateFromPoint). Each
// test exercises the real implementation, not the stub.

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Application } from '@hotwired/stimulus';
import CalendarController from '../../src/controllers/calendar_controller.js';

let app;
function mount(html) {
  document.body.innerHTML = html;
  app = Application.start();
  app.register('calendar', CalendarController);
  return document.querySelector('[data-controller~="calendar"]');
}

const tick = (n = 1) => Promise.all(Array.from({ length: n }, () => new Promise((r) => setTimeout(r, 0))));

describe('CalendarController public API', () => {
  beforeEach(() => { document.body.innerHTML = ''; });
  afterEach(() => { app?.stop(); app = null; vi.restoreAllMocks(); });

  describe('refetchEvents', () => {
    it('calls a function event source with start/end Date params', async () => {
      const source = vi.fn(async () => [
        { id: 'rf1', title: 'Refetched', start: '2026-05-25T09:00', end: '2026-05-25T10:00' },
      ]);
      const el = mount(`<div data-controller="calendar"
                              data-calendar-options-value='{"date":"2026-05-25","duration":{"weeks":1}}'></div>`);
      await tick();
      el.calendarApi.setOption('events', source);
      await el.calendarApi.refetchEvents();
      expect(source).toHaveBeenCalled();
      const call = source.mock.calls[0][0];
      expect(call.start instanceof Date).toBe(true);
      expect(call.end instanceof Date).toBe(true);
      expect(el.calendarApi.getEvents().map((e) => e.id)).toContain('rf1');
    });

    it('fetches a URL source with ?start=&end= query params', async () => {
      global.fetch = vi.fn(async () => ({
        ok: true,
        json: async () => [
          { id: 'url1', title: 'Remote', start: '2026-05-25T09:00', end: '2026-05-25T10:00' },
        ],
      }));
      const el = mount(`<div data-controller="calendar"
                              data-calendar-options-value='{"date":"2026-05-25","duration":{"weeks":1}}'></div>`);
      await tick();
      el.calendarApi.setOption('events', '/events.json');
      await el.calendarApi.refetchEvents();
      expect(global.fetch).toHaveBeenCalled();
      const url = global.fetch.mock.calls[0][0];
      expect(url).toContain('start=');
      expect(url).toContain('end=');
      expect(el.calendarApi.getEvents().map((e) => e.id)).toContain('url1');
    });
  });

  describe('refetchResources', () => {
    it('replaces resources from a function source', async () => {
      const source = vi.fn(async () => [{ id: 'r1', title: 'Studio' }]);
      const el = mount('<div data-controller="calendar"></div>');
      await tick();
      el.calendarApi.setOption('resources', source);
      await el.calendarApi.refetchResources();
      expect(source).toHaveBeenCalled();
      expect(el.calendarApi.getResources().map((r) => r.id)).toEqual(['r1']);
    });
  });

  describe('unselect', () => {
    it('clears state.selection and fires options.unselect', async () => {
      const cb = vi.fn();
      const el = mount('<div data-controller="calendar"></div>');
      await tick();
      el.calendarApi.setOption('unselect', cb);
      // Simulate a selection.
      el.calendarApi.setOption('events', []); // tickle state
      const c = el.querySelector('[data-controller="calendar"]') ?? el;
      // Use direct internal access to set selection (tests should not normally do this).
      const ctrl = app.getControllerForElementAndIdentifier(c, 'calendar');
      ctrl._state.set('selection', { start: new Date('2026-05-25T09:00Z'), end: new Date('2026-05-25T10:00Z') });
      el.calendarApi.unselect();
      expect(cb).toHaveBeenCalled();
      expect(ctrl._state.get('selection')).toBeNull();
    });
  });

  describe('dateFromPoint', () => {
    it('returns null when no calendar cell is under the point', async () => {
      const el = mount('<div data-controller="calendar"></div>');
      await tick();
      expect(el.calendarApi.dateFromPoint(-1, -1)).toBeNull();
    });

    it('returns a Date for a cell carrying [data-date]', async () => {
      const el = mount(`<div data-controller="calendar"
                              data-calendar-plugins-value='["DayGrid"]'
                              data-calendar-date-value="2026-05-15"></div>`);
      await tick();
      // happy-dom's elementsFromPoint doesn't actually do hit-testing —
      // we stub it to return the today cell and assert the date is parsed.
      const cell = el.querySelector('[data-date="2026-05-15"]');
      expect(cell).toBeTruthy();
      document.elementsFromPoint = () => [cell];
      const d = el.calendarApi.dateFromPoint(100, 100);
      expect(d).toBeInstanceOf(Date);
      expect(d.toISOString().substring(0, 10)).toBe('2026-05-15');
    });
  });
});
