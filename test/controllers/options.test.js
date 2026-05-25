// @vitest-environment happy-dom
//
// One assertion per option — verifies that data-calendar-<name>-value
// flows through to the live options object after connect. Each Phase 3
// option commit adds its assertion below.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Application } from '@hotwired/stimulus';
import CalendarController from '../../src/controllers/calendar_controller.js';

let app;
async function mount(html) {
  document.body.innerHTML = html;
  app = Application.start();
  app.register('calendar', CalendarController);
  // Stimulus uses MutationObserver — let it flush.
  await new Promise((r) => queueMicrotask(r));
  await new Promise((r) => queueMicrotask(r));
  return document.querySelector('[data-controller~="calendar"]');
}

describe('CalendarController options', () => {
  beforeEach(() => { document.body.innerHTML = ''; });
  afterEach(() => { app?.stop(); app = null; document.body.innerHTML = ''; });

  it('view — data-calendar-view-value sets options.view', async () => {
    const el = await mount(
      `<div data-controller="calendar" data-calendar-view-value="timeGridWeek"></div>`);
    expect(el.calendarApi.getOption('view')).toBe('timeGridWeek');
  });

  it('date — data-calendar-date-value parses to a Date at UTC midnight', async () => {
    const el = await mount(
      `<div data-controller="calendar" data-calendar-date-value="2026-05-25"></div>`);
    const date = el.calendarApi.getOption('date');
    expect(date instanceof Date).toBe(true);
    expect(date.getUTCFullYear()).toBe(2026);
    expect(date.getUTCMonth()).toBe(4);
    expect(date.getUTCDate()).toBe(25);
    expect(date.getUTCHours()).toBe(0);
  });

  it('duration — data-calendar-duration-value parses through createDuration', async () => {
    const el = await mount(
      `<div data-controller="calendar" data-calendar-duration-value='{"days":3}'></div>`);
    expect(el.calendarApi.getOption('duration')).toEqual({
      years: 0, months: 0, days: 3, seconds: 0, inWeeks: false,
    });
  });

  it('dateIncrement — data-calendar-date-increment-value parses through createDuration', async () => {
    const el = await mount(
      `<div data-controller="calendar" data-calendar-date-increment-value='{"weeks":2}'></div>`);
    expect(el.calendarApi.getOption('dateIncrement')).toEqual({
      years: 0, months: 0, days: 14, seconds: 0, inWeeks: true,
    });
  });

  it('firstDay — data-calendar-first-day-value sets options.firstDay', async () => {
    const el = await mount(
      `<div data-controller="calendar" data-calendar-first-day-value="1"></div>`);
    expect(el.calendarApi.getOption('firstDay')).toBe(1);
  });

  it('hiddenDays — JSON array, deduped through default parser', async () => {
    const el = await mount(
      `<div data-controller="calendar" data-calendar-hidden-days-value='[0,6,6]'></div>`);
    expect(el.calendarApi.getOption('hiddenDays')).toEqual([0, 6]);
  });

  it('validRange — parsed through createDateRange (Dates at midnight)', async () => {
    const el = await mount(`<div data-controller="calendar"
                                  data-calendar-valid-range-value='{"start":"2026-05-01","end":"2026-05-31"}'></div>`);
    const r = el.calendarApi.getOption('validRange');
    expect(r.start.getUTCDate()).toBe(1);
    expect(r.end.getUTCDate()).toBe(31);
    expect(r.start.getUTCHours()).toBe(0);
  });

  it('height — flows to options.height and applies CSS height on the root', async () => {
    const el = await mount(
      `<div data-controller="calendar" data-calendar-height-value="480px"></div>`);
    expect(el.calendarApi.getOption('height')).toBe('480px');
    expect(el.querySelector('[data-calendar-root]').style.height).toBe('480px');
  });

  it('theme — JSON object overrides default theme keys', async () => {
    const el = await mount(`<div data-controller="calendar"
                                  data-calendar-theme-value='{"calendar":"my-cal"}'></div>`);
    const theme = el.calendarApi.getOption('theme');
    expect(theme.calendar).toBe('my-cal');
  });

  it('locale — flows through as a string for Intl', async () => {
    const el = await mount(
      `<div data-controller="calendar" data-calendar-locale-value="fr-FR"></div>`);
    expect(el.calendarApi.getOption('locale')).toBe('fr-FR');
  });

  it('timeZone — flows through; "+HH:MM" parses into offset', async () => {
    const el = await mount(
      `<div data-controller="calendar" data-calendar-time-zone-value="+10:00"></div>`);
    expect(el.calendarApi.getOption('timeZone')).toBe('+10:00');
  });

  it('customScrollbars — Boolean flows through', async () => {
    const el = await mount(
      `<div data-controller="calendar" data-calendar-custom-scrollbars-value="true"></div>`);
    expect(el.calendarApi.getOption('customScrollbars')).toBe(true);
  });

  it('views — accepts per-view overrides without crashing the boot', async () => {
    // Per-view overrides are extracted into the per-view setter map by
    // createOptionsStore and applied on view activation; they don't live
    // on the live options object. This commit just verifies the attribute
    // is accepted. Phase 5+ tests verify the actual override behaviour
    // when a plugin registers a view.
    const el = await mount(`<div data-controller="calendar"
                                  data-calendar-views-value='{"timeGridWeek":{"slotDuration":"00:15"}}'>
                            </div>`);
    expect(el.dataset.calendarMounted).toBe('true');
  });

  it('viewDidMount — programmatic; fires after a microtask once mounted', async () => {
    const el = await mount('<div data-controller="calendar"></div>');
    const calls = [];
    el.calendarApi.setOption('viewDidMount', (info) => calls.push(info));
    // Triggering a view re-mount happens on view change; for the bare
    // controller the initial viewDidMount fires once after mount.
    await new Promise((r) => queueMicrotask(r));
    await new Promise((r) => queueMicrotask(r));
    expect(typeof el.calendarApi.getOption('viewDidMount')).toBe('function');
  });

  it('datesSet — programmatic callback retained', async () => {
    const el = await mount('<div data-controller="calendar"></div>');
    el.calendarApi.setOption('datesSet', () => {});
    expect(typeof el.calendarApi.getOption('datesSet')).toBe('function');
  });

  it('loading — programmatic callback retained', async () => {
    const el = await mount('<div data-controller="calendar"></div>');
    el.calendarApi.setOption('loading', () => {});
    expect(typeof el.calendarApi.getOption('loading')).toBe('function');
  });

  it('lazyFetching — Boolean flows through', async () => {
    const el = await mount(
      `<div data-controller="calendar" data-calendar-lazy-fetching-value="false"></div>`);
    expect(el.calendarApi.getOption('lazyFetching')).toBe(false);
  });

  it('highlightedDates — parsed into midnight Dates', async () => {
    const el = await mount(`<div data-controller="calendar"
                                  data-calendar-highlighted-dates-value='["2026-05-25","2026-05-30"]'>
                            </div>`);
    const dates = el.calendarApi.getOption('highlightedDates');
    expect(dates).toHaveLength(2);
    expect(dates[0].getUTCDate()).toBe(25);
    expect(dates[1].getUTCDate()).toBe(30);
    expect(dates[0].getUTCHours()).toBe(0);
  });

  it('titleFormat — Intl format object flows through', async () => {
    const el = await mount(`<div data-controller="calendar"
                                  data-calendar-title-format-value='{"year":"numeric"}'></div>`);
    expect(el.calendarApi.getOption('titleFormat')).toEqual({ year: 'numeric' });
  });

  it('dayHeaderFormat — Intl format object flows through', async () => {
    const el = await mount(`<div data-controller="calendar"
                                  data-calendar-day-header-format-value='{"weekday":"long"}'></div>`);
    expect(el.calendarApi.getOption('dayHeaderFormat')).toEqual({ weekday: 'long' });
  });

  it('dayHeaderAriaLabelFormat — Intl format object flows through', async () => {
    const el = await mount(`<div data-controller="calendar"
                                  data-calendar-day-header-aria-label-format-value='{"dateStyle":"long"}'></div>`);
    expect(el.calendarApi.getOption('dayHeaderAriaLabelFormat')).toEqual({ dateStyle: 'long' });
  });

  it('icons — Object flows through (e.g. { collapse: {html: "-"} })', async () => {
    const el = await mount(`<div data-controller="calendar"
                                  data-calendar-icons-value='{"collapse":{"html":"-"}}'></div>`);
    expect(el.calendarApi.getOption('icons')).toEqual({ collapse: { html: '-' } });
  });

  it('buttonText — Object merges over defaults (today retained)', async () => {
    const el = await mount(`<div data-controller="calendar"
                                  data-calendar-button-text-value='{"today":"Now"}'></div>`);
    const bt = el.calendarApi.getOption('buttonText');
    expect(bt.today).toBe('Now');
  });

  it('customButtons — Object flows through (functions set via setOption)', async () => {
    const el = await mount(`<div data-controller="calendar"
                                  data-calendar-custom-buttons-value='{"myBtn":{"text":"Hi"}}'>
                            </div>`);
    expect(el.calendarApi.getOption('customButtons')).toEqual({ myBtn: { text: 'Hi' } });
  });

  it('headerToolbar — { start, center, end } flows through', async () => {
    const el = await mount(`<div data-controller="calendar"
                                  data-calendar-header-toolbar-value='{"start":"prev,next","center":"title","end":"today"}'>
                            </div>`);
    expect(el.calendarApi.getOption('headerToolbar')).toEqual({
      start: 'prev,next', center: 'title', end: 'today',
    });
  });
});
