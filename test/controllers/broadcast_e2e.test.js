// @vitest-environment happy-dom
//
// End-to-end broadcast test — boots two CalendarController instances
// configured with the broadcast-channel adapter and a shared channel name.
// Mutating one instance should propagate to the other via the actual
// BroadcastBus + happy-dom's BroadcastChannel implementation, with no
// mocked transports.
//
// This guards the wiring chain that's easy to break silently:
//   data-calendar-broadcast-value → options.broadcast → resolveAdapter →
//   BroadcastBus → adapter.send → other tab's adapter.onReceive →
//   bus.subscribers → controller._applyBroadcast → state.events update.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Application } from '@hotwired/stimulus';
import CalendarController from '../../src/controllers/calendar_controller.js';

let app;

function mountPair(channel = 'test-bus') {
  document.body.innerHTML = `
    <div id="a" data-controller="calendar"
         data-calendar-broadcast-value="broadcast-channel"
         data-calendar-broadcast-channel-value="${channel}"></div>
    <div id="b" data-controller="calendar"
         data-calendar-broadcast-value="broadcast-channel"
         data-calendar-broadcast-channel-value="${channel}"></div>
  `;
  app = Application.start();
  app.register('calendar', CalendarController);
  return [document.getElementById('a'), document.getElementById('b')];
}

// BroadcastChannel delivery is microtask-async; flush + give the runtime a
// real tick before asserting on the receiving side.
async function settle() {
  for (let i = 0; i < 5; ++i) await new Promise((r) => setTimeout(r, 0));
}

describe('CalendarController broadcast end-to-end', () => {
  beforeEach(() => { document.body.innerHTML = ''; });
  afterEach(() => { app?.stop(); app = null; });

  it('addEvent on A propagates to B via BroadcastChannel', async () => {
    const [a, b] = mountPair('add-e2e');
    await settle();
    expect(a.calendarApi.getOption('broadcast')).toBe('broadcast-channel');
    expect(b.calendarApi.getOption('broadcast')).toBe('broadcast-channel');

    a.calendarApi.addEvent({
      id: 'sync-1', title: 'Standup',
      start: '2026-05-25T09:00', end: '2026-05-25T09:30',
    });
    await settle();

    const bEvent = b.calendarApi.getEventById('sync-1');
    expect(bEvent).toBeTruthy();
    expect(bEvent.title).toBe('Standup');
  });

  it('updateEvent on A reflects on B', async () => {
    const [a, b] = mountPair('upd-e2e');
    await settle();
    a.calendarApi.addEvent({
      id: 'sync-2', title: 'Old', start: '2026-05-25T09:00', end: '2026-05-25T10:00',
    });
    await settle();
    a.calendarApi.updateEvent({ id: 'sync-2', title: 'New' });
    await settle();
    expect(b.calendarApi.getEventById('sync-2').title).toBe('New');
  });

  it('removeEventById on A removes from B', async () => {
    const [a, b] = mountPair('rm-e2e');
    await settle();
    a.calendarApi.addEvent({
      id: 'sync-3', title: 'Doomed', start: '2026-05-25T09:00', end: '2026-05-25T10:00',
    });
    await settle();
    a.calendarApi.removeEventById('sync-3');
    await settle();
    expect(b.calendarApi.getEventById('sync-3')).toBeUndefined();
  });

  it('the originating bus drops its own echoes (no duplicate events on A)', async () => {
    const [a] = mountPair('echo-e2e');
    await settle();
    a.calendarApi.addEvent({
      id: 'sync-4', title: 'Once', start: '2026-05-25T09:00', end: '2026-05-25T10:00',
    });
    await settle();
    const matches = a.calendarApi.getEvents().filter((e) => e.id === 'sync-4');
    expect(matches).toHaveLength(1);
  });

  it('isolated channels do not cross-talk', async () => {
    document.body.innerHTML = `
      <div id="a" data-controller="calendar"
           data-calendar-broadcast-value="broadcast-channel"
           data-calendar-broadcast-channel-value="ch-a"></div>
      <div id="b" data-controller="calendar"
           data-calendar-broadcast-value="broadcast-channel"
           data-calendar-broadcast-channel-value="ch-b"></div>
    `;
    app = Application.start();
    app.register('calendar', CalendarController);
    const a = document.getElementById('a');
    const b = document.getElementById('b');
    await settle();
    a.calendarApi.addEvent({
      id: 'sync-5', title: 'A only', start: '2026-05-25T09:00', end: '2026-05-25T10:00',
    });
    await settle();
    expect(b.calendarApi.getEventById('sync-5')).toBeUndefined();
  });
});
