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

  it('partial updateEvent broadcasts the merged state (title + colour survive)', async () => {
    // Regression: a drag commit hands updateEvent a partial payload
    // (`{id, start, end}`). Locally that merges with the existing event,
    // but the broadcast used to publish the raw partial — so the receiver's
    // `createEvents([...])` returned a fresh event with title='' and
    // backgroundColor=undefined and the merge clobbered both.
    const [a, b] = mountPair('partial-upd-e2e');
    await settle();
    a.calendarApi.addEvent({
      id: 'sync-6',
      title: 'Design crit',
      start: '2026-05-26T14:00:00Z',
      end: '2026-05-26T15:30:00Z',
      backgroundColor: '#dc2626',
    });
    await settle();
    expect(b.calendarApi.getEventById('sync-6').title).toBe('Design crit');
    expect(b.calendarApi.getEventById('sync-6').backgroundColor).toBe('#dc2626');

    a.calendarApi.updateEvent({
      id: 'sync-6',
      start: '2026-05-27T08:00:00Z',
      end: '2026-05-27T13:00:00Z',
    });
    await settle();
    const after = b.calendarApi.getEventById('sync-6');
    expect(after.title).toBe('Design crit');
    expect(after.backgroundColor).toBe('#dc2626');
    expect(after.start.toISOString()).toBe('2026-05-27T08:00:00.000Z');
    expect(after.end.toISOString()).toBe('2026-05-27T13:00:00.000Z');
  });

  it('cross-timezone broadcast preserves the UTC instant', async () => {
    // Two calendars on the same channel but in different IANA timezones.
    // The sender publishes its wall-clock + its own offset; the receiver
    // shifts to its own offset preserving the actual UTC moment.
    document.body.innerHTML = `
      <div id="syd" data-controller="calendar"
           data-calendar-time-zone-value="+10:00"
           data-calendar-date-value="2026-05-25"
           data-calendar-broadcast-value="broadcast-channel"
           data-calendar-broadcast-channel-value="cross-tz"></div>
      <div id="ny"  data-controller="calendar"
           data-calendar-time-zone-value="-04:00"
           data-calendar-date-value="2026-05-25"
           data-calendar-broadcast-value="broadcast-channel"
           data-calendar-broadcast-channel-value="cross-tz"></div>
    `;
    app = Application.start();
    app.register('calendar', CalendarController);
    const syd = document.getElementById('syd');
    const ny  = document.getElementById('ny');
    await settle();

    // Sydney adds an event at 09:00 +10:00 (i.e. 23:00Z the prior day).
    syd.calendarApi.addEvent({
      id: 'tz-1',
      title: 'Standup',
      start: '2026-05-25T09:00:00+10:00',
      end:   '2026-05-25T09:30:00+10:00',
    });
    await settle();

    // The same UTC instant 23:00Z prior day rendered in NY (-04:00 EDT)
    // is 19:00 wall-clock on May 24. Internal Date is UTC-encoded
    // wall-clock, so getUTCHours() should be 19, getUTCDate() should be 24.
    const recv = ny.calendarApi.getEventById('tz-1');
    expect(recv).toBeTruthy();
    expect(recv.start.getUTCHours()).toBe(19);
    expect(recv.start.getUTCDate()).toBe(24);
    expect(recv.end.getUTCHours()).toBe(19);
    expect(recv.end.getUTCMinutes()).toBe(30);

    // Title still propagates.
    expect(recv.title).toBe('Standup');
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
