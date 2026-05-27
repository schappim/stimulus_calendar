// @vitest-environment happy-dom
//
// Verifies the Hotwire Native bridge action channel (S7).

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
const tick = (n = 1) => Promise.all(Array.from({ length: n }, () => new Promise((r) => setTimeout(r, 0))));

function fireClick(target, init = {}) {
  const ev = new MouseEvent('click', Object.assign({ bubbles: true, cancelable: true, button: 0 }, init));
  target.dispatchEvent(ev);
  return ev;
}

// Inject a custom event-content renderer that wraps the event title
// in an <a data-bridge-action="tel" data-payload="…">. This is what a
// host would do via `options.eventContent` to opt a single chip into
// the bridge channel.
async function mountWithBridgeEvent(bridgeActions) {
  const el = await mount(`<div data-controller="calendar"
    data-calendar-plugins-value='["DayGrid"]'
    data-calendar-date-value="2026-05-15"></div>`);
  el.calendarApi.setOption('bridgeActions', bridgeActions);
  el.calendarApi.setOption('eventContent', ({ event }) => ({
    html: `<a class="bridge-link"
              data-bridge-action="tel"
              data-payload="+61400000000"
              href="tel:+61400000000">${event.title}</a>`,
  }));
  el.calendarApi.addEvent({
    id: 'job-42', title: 'Call customer',
    start: '2026-05-15T09:00', end: '2026-05-15T10:00',
  });
  await tick();
  return el;
}

describe('Hotwire Native bridge action channel', () => {
  beforeEach(() => { document.body.innerHTML = ''; });
  afterEach(() => { app?.stop(); app = null; });

  it('fires calendar:bridgeAction with the right detail when bridgeActions is on', async () => {
    const el = await mountWithBridgeEvent(true);
    const link = el.querySelector('.bridge-link');
    expect(link).toBeTruthy();

    const onBridge = vi.fn();
    el.addEventListener('calendar:bridgeAction', onBridge);
    fireClick(link);

    expect(onBridge).toHaveBeenCalled();
    const detail = onBridge.mock.calls[0][0].detail;
    expect(detail.kind).toBe('tel');
    expect(detail.payload).toBe('+61400000000');
    expect(detail.fallbackHref).toBe('tel:+61400000000');
    expect(detail.el).toBe(link);
  });

  it('preventDefault on calendar:bridgeAction suppresses the underlying click', async () => {
    const el = await mountWithBridgeEvent(true);
    const link = el.querySelector('.bridge-link');
    el.addEventListener('calendar:bridgeAction', (ev) => ev.preventDefault());

    const jsEvent = fireClick(link);
    expect(jsEvent.defaultPrevented).toBe(true);
  });

  it('NOT calling preventDefault leaves the link click to its natural behaviour', async () => {
    const el = await mountWithBridgeEvent(true);
    const link = el.querySelector('.bridge-link');
    el.addEventListener('calendar:bridgeAction', () => {/* no preventDefault */});

    const jsEvent = fireClick(link);
    expect(jsEvent.defaultPrevented).toBe(false);
  });

  it('does NOT fire calendar:bridgeAction when bridgeActions is off (default)', async () => {
    const el = await mountWithBridgeEvent(false);
    const link = el.querySelector('.bridge-link');
    const onBridge = vi.fn();
    el.addEventListener('calendar:bridgeAction', onBridge);
    fireClick(link);
    expect(onBridge).not.toHaveBeenCalled();
  });

  it('clicks on non-bridge elements pass through untouched', async () => {
    const el = await mountWithBridgeEvent(true);
    const onBridge = vi.fn();
    el.addEventListener('calendar:bridgeAction', onBridge);
    // Click somewhere on the calendar that isn't an event chip or bridge link.
    const someCell = el.querySelector('[data-date]');
    fireClick(someCell);
    expect(onBridge).not.toHaveBeenCalled();
  });
});
