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

describe('view: timeGridWeek', () => {
  beforeEach(() => { document.body.innerHTML = ''; });
  afterEach(() => { app?.stop(); app = null; document.body.innerHTML = ''; });

  it('renders a sidebar + 7 day columns + slot grid', async () => {
    const el = await mount(`<div data-controller="calendar"
      data-calendar-plugins-value='["TimeGrid"]'
      data-calendar-view-value="timeGridWeek"
      data-calendar-date-value="2026-05-25"></div>`);
    const grid = el.querySelector('[data-grid="time-grid"]');
    expect(grid).toBeTruthy();
    const sidebar = grid.querySelector('[data-row="body"] > .ec-sidebar');
    expect(sidebar).toBeTruthy();
    expect(sidebar.children.length).toBeGreaterThan(0);
    const cols = grid.querySelectorAll('.ec-time-col');
    expect(cols.length).toBe(7);
  });

  it('positions a 09:00–09:30 event at the right slot', async () => {
    const el = await mount(`<div data-controller="calendar"
      data-calendar-plugins-value='["TimeGrid"]'
      data-calendar-view-value="timeGridDay"
      data-calendar-date-value="2026-05-25"></div>`);
    el.calendarApi.addEvent({
      id: '1', title: 'Standup',
      start: '2026-05-25T09:00', end: '2026-05-25T09:30',
    });
    const chip = el.querySelector('[data-event-id="1"]');
    expect(chip).toBeTruthy();
    expect(parseFloat(chip.style.top)).toBeGreaterThan(0);
    expect(parseFloat(chip.style.height)).toBeGreaterThan(0);
  });

  it('renders an all-day row when allDaySlot (default), with one cell per visible day', async () => {
    const el = await mount(`<div data-controller="calendar"
      data-calendar-plugins-value='["TimeGrid"]'
      data-calendar-view-value="timeGridWeek"
      data-calendar-date-value="2026-05-25"></div>`);
    const row = el.querySelector('[data-row="all-day"]');
    expect(row).toBeTruthy();
    expect(row.querySelectorAll('.ec-all-day-cell').length).toBe(7);
  });

  it('hides the all-day row when allDaySlot is false', async () => {
    const el = await mount(`<div data-controller="calendar"
      data-calendar-plugins-value='["TimeGrid"]'
      data-calendar-view-value="timeGridWeek"
      data-calendar-date-value="2026-05-25"></div>`);
    el.calendarApi.setOption('allDaySlot', false);
    expect(el.querySelector('[data-row="all-day"]')).toBeNull();
  });

  it('allDayContent (function) overrides the all-day label', async () => {
    const el = await mount(`<div data-controller="calendar"
      data-calendar-plugins-value='["TimeGrid"]'
      data-calendar-view-value="timeGridWeek"
      data-calendar-date-value="2026-05-25"></div>`);
    el.calendarApi.setOption('allDayContent', () => 'All day');
    const label = el.querySelector('.ec-all-day-label');
    expect(label.textContent).toBe('All day');
  });

  it('nowIndicator draws a horizontal line on the today column when enabled', async () => {
    const el = await mount(`<div data-controller="calendar"
      data-calendar-plugins-value='["TimeGrid"]'
      data-calendar-view-value="timeGridDay"></div>`);
    el.calendarApi.setOption('nowIndicator', true);
    const line = el.querySelector('[data-now-indicator]');
    expect(line).toBeTruthy();
  });

  it('slotEventOverlap accepted as option (full overlap layout in Phase 11)', async () => {
    const el = await mount(`<div data-controller="calendar"
      data-calendar-plugins-value='["TimeGrid"]'
      data-calendar-view-value="timeGridDay"></div>`);
    el.calendarApi.setOption('slotEventOverlap', false);
    expect(el.calendarApi.getOption('slotEventOverlap')).toBe(false);
  });

  it('fans overlapping chips into side-by-side lane fractions (laneCount=3)', async () => {
    // A: 09:00–10:30, B: 10:00–11:00, C: 10:15–12:30 — all three share
    // a transitive cluster, so each chip should render at width
    // calc(33.33...% - 6px) with lefts calc(0% + 0px), calc(33.33...% + 3px),
    // calc(66.66...% + 6px).
    const el = await mount(`<div data-controller="calendar"
      data-calendar-plugins-value='["TimeGrid"]'
      data-calendar-view-value="timeGridDay"
      data-calendar-date-value="2026-05-25"></div>`);
    el.calendarApi.addEvent({ id: 'la', title: 'A', start: '2026-05-25T09:00', end: '2026-05-25T10:30' });
    el.calendarApi.addEvent({ id: 'lb', title: 'B', start: '2026-05-25T10:00', end: '2026-05-25T11:00' });
    el.calendarApi.addEvent({ id: 'lc', title: 'C', start: '2026-05-25T10:15', end: '2026-05-25T12:30' });
    const a = el.querySelector('[data-event-id="la"]');
    const b = el.querySelector('[data-event-id="lb"]');
    const c = el.querySelector('[data-event-id="lc"]');
    expect(a.style.width).toMatch(/calc\(33\.3\d+% - 6px\)/);
    expect(b.style.width).toMatch(/calc\(33\.3\d+% - 6px\)/);
    expect(c.style.width).toMatch(/calc\(33\.3\d+% - 6px\)/);
    expect(a.style.left).toMatch(/calc\(0% \+ 0px\)/);
    expect(b.style.left).toMatch(/calc\(33\.3\d+% \+ 3px\)/);
    expect(c.style.left).toMatch(/calc\(66\.6\d+% \+ 6px\)/);
  });

  it('single-occupancy events take the fast 100% / left:0 path (no calc)', async () => {
    const el = await mount(`<div data-controller="calendar"
      data-calendar-plugins-value='["TimeGrid"]'
      data-calendar-view-value="timeGridDay"
      data-calendar-date-value="2026-05-25"></div>`);
    el.calendarApi.addEvent({ id: 'solo', title: 'Solo', start: '2026-05-25T09:00', end: '2026-05-25T10:00' });
    const chip = el.querySelector('[data-event-id="solo"]');
    expect(chip.style.left).toBe('0px');
    expect(chip.style.right).toBe('0px');
    expect(chip.style.width).toBe('');
  });

  it('touching-but-not-overlapping events open separate clusters (back-to-back)', async () => {
    // A: 09:00–10:00, B: 10:00–11:00 — half-open intervals mean A is
    // evicted at B's start, so they end up in separate clusters and
    // each renders full-width.
    const el = await mount(`<div data-controller="calendar"
      data-calendar-plugins-value='["TimeGrid"]'
      data-calendar-view-value="timeGridDay"
      data-calendar-date-value="2026-05-25"></div>`);
    el.calendarApi.addEvent({ id: 'ta', title: 'A', start: '2026-05-25T09:00', end: '2026-05-25T10:00' });
    el.calendarApi.addEvent({ id: 'tb', title: 'B', start: '2026-05-25T10:00', end: '2026-05-25T11:00' });
    expect(el.querySelector('[data-event-id="ta"]').style.width).toBe('');
    expect(el.querySelector('[data-event-id="tb"]').style.width).toBe('');
  });

  it('all-day events render inside the all-day row, not the slot grid', async () => {
    const el = await mount(`<div data-controller="calendar"
      data-calendar-plugins-value='["TimeGrid"]'
      data-calendar-view-value="timeGridDay"
      data-calendar-date-value="2026-05-25"></div>`);
    el.calendarApi.addEvent({
      id: 'ad', title: 'Holiday', allDay: true,
      start: '2026-05-25', end: '2026-05-26',
    });
    const row = el.querySelector('[data-row="all-day"]');
    expect(row.querySelector('[data-event-id="ad"]')).toBeTruthy();
    const body = el.querySelector('[data-row="body"]');
    expect(body.querySelector('[data-event-id="ad"]')).toBeNull();
  });
});
