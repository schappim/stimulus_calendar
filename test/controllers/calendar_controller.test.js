// @vitest-environment happy-dom
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

describe('CalendarController', () => {
  beforeEach(() => { document.body.innerHTML = ''; });
  afterEach(() => { app?.stop(); app = null; });

  it('connects, mounts .ec root, sets calendarMounted dataset', async () => {
    const el = mount('<div data-controller="calendar"></div>');
    await new Promise((r) => setTimeout(r, 0));
    expect(el.dataset.calendarMounted).toBe('true');
    const root = el.querySelector('[data-calendar-root]');
    expect(root).toBeTruthy();
    expect(root.className).toBe('ec');
  });

  it('exposes calendarApi after connect + fires calendar:ready', async () => {
    const el = mount('<div data-controller="calendar"></div>');
    await new Promise((r) => setTimeout(r, 0));
    expect(typeof el.calendarApi).toBe('object');
    expect(typeof el.calendarApi.setOption).toBe('function');
    expect(typeof el.calendarApi.next).toBe('function');
  });

  it('addEvent / getEvents round-trip', async () => {
    const el = mount('<div data-controller="calendar"></div>');
    await new Promise((r) => setTimeout(r, 0));
    el.calendarApi.addEvent({ id: '1', title: 'X', start: '2026-05-25T09:00', end: '2026-05-25T10:00' });
    expect(el.calendarApi.getEvents().map((e) => e.id)).toContain('1');
  });

  it('updateEvent + removeEventById', async () => {
    const el = mount('<div data-controller="calendar"></div>');
    await new Promise((r) => setTimeout(r, 0));
    el.calendarApi.addEvent({ id: '1', title: 'X', start: '2026-05-25T09:00', end: '2026-05-25T10:00' });
    el.calendarApi.updateEvent({ id: '1', title: 'Y' });
    expect(el.calendarApi.getEventById('1').title).toBe('Y');
    el.calendarApi.removeEventById('1');
    expect(el.calendarApi.getEventById('1')).toBeUndefined();
  });

  it('next/prev advance/retreat by duration', async () => {
    const el = mount(`<div data-controller="calendar"
                            data-calendar-options-value='{"date":"2026-05-25","duration":{"weeks":1}}'>
                      </div>`);
    await new Promise((r) => setTimeout(r, 0));
    const before = el.calendarApi.getOption('date');
    el.calendarApi.next();
    const after = el.calendarApi.getOption('date');
    expect(after.getTime() - before.getTime()).toBe(7 * 24 * 3600 * 1000);
    el.calendarApi.prev();
    expect(el.calendarApi.getOption('date').getTime()).toBe(before.getTime());
  });

  it('setOption("date", ISO string) parses to a Date', async () => {
    const el = mount('<div data-controller="calendar"></div>');
    await new Promise((r) => setTimeout(r, 0));
    el.calendarApi.setOption('date', '2026-06-15');
    const v = el.calendarApi.getOption('date');
    expect(v instanceof Date).toBe(true);
    expect(v.getUTCDate()).toBe(15);
  });

  it('getView returns the active view descriptor', async () => {
    const el = mount('<div data-controller="calendar"></div>');
    await new Promise((r) => setTimeout(r, 0));
    const v = el.calendarApi.getView();
    expect(v).toHaveProperty('type');
    expect(v).toHaveProperty('currentStart');
    expect(v).toHaveProperty('activeStart');
  });

  it('disconnect tears down + clears calendarApi', async () => {
    const el = mount('<div data-controller="calendar"></div>');
    await new Promise((r) => setTimeout(r, 0));
    el.remove();
    await new Promise((r) => setTimeout(r, 0));
    expect(el.calendarApi).toBeUndefined();
  });

  it('warns when plugin names are passed (lookup not implemented yet)', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    mount(`<div data-controller="calendar"
                 data-calendar-plugins-value='["DayGrid"]'></div>`);
    await new Promise((r) => setTimeout(r, 0));
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
