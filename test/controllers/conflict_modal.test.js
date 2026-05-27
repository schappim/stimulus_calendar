// @vitest-environment happy-dom
//
// S13 — default conflict-resolution modal. Verifies the controller's
// reaction to an inbound `op="conflict"` broadcast and the default
// modal's accept / reject / dismiss paths.

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

function controllerFor(el, app) {
  return app.getControllerForElementAndIdentifier(el, 'calendar');
}

describe('controller — conflict modal (S13)', () => {
  beforeEach(() => { document.body.innerHTML = ''; });
  afterEach(() => { app?.stop(); app = null; });

  it('renders the default modal on op=conflict and surfaces server + client values', async () => {
    const el = await mount(`<div data-controller="calendar"
      data-calendar-plugins-value='["DayGrid"]'
      data-calendar-date-value="2026-05-15"></div>`);
    el.calendarApi.addEvent({
      id: 'evt-42', title: 'Edit me',
      start: '2026-05-15T09:00', end: '2026-05-15T10:00',
    });
    const ctrl = controllerFor(el, app);
    ctrl._applyBroadcast({
      op: 'conflict',
      eventId: 'evt-42',
      serverValue: { title: 'Server title', start: '2026-05-15T09:30' },
      clientValue: { title: 'Client title', start: '2026-05-15T09:45' },
    });

    const modal = el.querySelector('.ec-conflict-modal');
    expect(modal).toBeTruthy();
    const body = modal.textContent;
    expect(body).toContain('Server title');
    expect(body).toContain('Client title');
  });

  it('"Use theirs" applies serverValue locally + fires calendar:conflictResolved', async () => {
    const el = await mount(`<div data-controller="calendar"
      data-calendar-plugins-value='["DayGrid"]'
      data-calendar-date-value="2026-05-15"></div>`);
    el.calendarApi.addEvent({
      id: 'evt-42', title: 'Original',
      start: '2026-05-15T09:00', end: '2026-05-15T10:00',
    });
    const ctrl = controllerFor(el, app);
    const onResolved = vi.fn();
    el.addEventListener('calendar:conflictResolved', (ev) => onResolved(ev.detail));

    ctrl._applyBroadcast({
      op: 'conflict',
      eventId: 'evt-42',
      serverValue: { title: 'Server title', start: '2026-05-15T11:00', end: '2026-05-15T12:00' },
      clientValue: { title: 'Client title', start: '2026-05-15T09:45', end: '2026-05-15T10:45' },
    });

    el.querySelector('.ec-conflict-action-theirs').click();

    expect(el.calendarApi.getEventById('evt-42').title).toBe('Server title');
    expect(onResolved).toHaveBeenCalled();
    expect(onResolved.mock.calls[0][0].resolution).toBe('theirs');
    expect(onResolved.mock.calls[0][0].eventId).toBe('evt-42');
    // Modal removed from DOM after resolution.
    expect(el.querySelector('.ec-conflict-modal')).toBeNull();
  });

  it('"Keep mine" applies clientValue locally + fires calendar:conflictResolved with resolution=mine', async () => {
    const el = await mount(`<div data-controller="calendar"
      data-calendar-plugins-value='["DayGrid"]'
      data-calendar-date-value="2026-05-15"></div>`);
    el.calendarApi.addEvent({
      id: 'evt-42', title: 'Original',
      start: '2026-05-15T09:00', end: '2026-05-15T10:00',
    });
    const ctrl = controllerFor(el, app);
    const onResolved = vi.fn();
    el.addEventListener('calendar:conflictResolved', (ev) => onResolved(ev.detail));

    ctrl._applyBroadcast({
      op: 'conflict',
      eventId: 'evt-42',
      serverValue: { title: 'Server title' },
      clientValue: { title: 'Client title' },
    });

    el.querySelector('.ec-conflict-action-mine').click();

    expect(el.calendarApi.getEventById('evt-42').title).toBe('Client title');
    expect(onResolved.mock.calls[0][0].resolution).toBe('mine');
  });

  it('backdrop click dismisses without applying either value', async () => {
    const el = await mount(`<div data-controller="calendar"
      data-calendar-plugins-value='["DayGrid"]'
      data-calendar-date-value="2026-05-15"></div>`);
    el.calendarApi.addEvent({
      id: 'evt-42', title: 'Original',
      start: '2026-05-15T09:00', end: '2026-05-15T10:00',
    });
    const ctrl = controllerFor(el, app);
    const onResolved = vi.fn();
    el.addEventListener('calendar:conflictResolved', (ev) => onResolved(ev.detail));

    ctrl._applyBroadcast({
      op: 'conflict',
      eventId: 'evt-42',
      serverValue: { title: 'Server title' },
      clientValue: { title: 'Client title' },
    });

    const backdrop = el.querySelector('.ec-conflict-backdrop');
    backdrop.click();

    expect(el.calendarApi.getEventById('evt-42').title).toBe('Original');
    expect(onResolved.mock.calls[0][0].resolution).toBe('dismissed');
  });

  it('options.conflictRenderer replaces the default modal', async () => {
    const el = await mount(`<div data-controller="calendar"
      data-calendar-plugins-value='["DayGrid"]'
      data-calendar-date-value="2026-05-15"></div>`);
    el.calendarApi.addEvent({
      id: 'evt-42', title: 'Original',
      start: '2026-05-15T09:00', end: '2026-05-15T10:00',
    });
    const renderer = vi.fn(({ hostEl, onResolve }) => {
      const custom = document.createElement('div');
      custom.className = 'host-modal';
      hostEl.append(custom);
      // Immediately resolve "mine" to keep the test deterministic.
      queueMicrotask(() => onResolve({ resolution: 'mine', eventId: 'evt-42',
        serverValue: { title: 'S' }, clientValue: { title: 'C' } }));
      return { close: () => custom.remove() };
    });
    el.calendarApi.setOption('conflictRenderer', renderer);

    const ctrl = controllerFor(el, app);
    ctrl._applyBroadcast({
      op: 'conflict',
      eventId: 'evt-42',
      serverValue: { title: 'S' },
      clientValue: { title: 'C' },
    });

    // The default modal is NOT used.
    expect(el.querySelector('.ec-conflict-modal')).toBeNull();
    // The host's custom modal IS appended.
    expect(el.querySelector('.host-modal')).toBeTruthy();
    expect(renderer).toHaveBeenCalled();
    // Let the queued onResolve run.
    await tick();
    expect(el.calendarApi.getEventById('evt-42').title).toBe('C');
  });
});
