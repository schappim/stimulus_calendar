// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import {
  createEvents, createEventSources,
  toEventWithLocalDates, cloneEvent,
  runReposition, eventIntersects,
  bgEvent, previewEvent, ghostEvent, pointerEvent, helperEvent,
  createTimeElement,
} from '../../src/lib/events.js';
import { createDate } from '../../src/lib/date.js';

const d = (iso) => createDate(iso);

describe('lib/events', () => {
  it('createEvents normalises required fields + coerces id to string', () => {
    const [e] = createEvents([{
      id: 42, title: 'X', start: '2026-05-25T09:00', end: '2026-05-25T10:00',
    }]);
    expect(e.id).toBe('42');
    expect(e.title).toBe('X');
    expect(e.start.getUTCHours()).toBe(9);
    expect(e.allDay).toBe(false);
    expect(e.resourceIds).toEqual([]);
    expect(e.extendedProps).toEqual({});
    expect(e.classNames).toEqual([]);
    expect(e.display).toBe('auto');
  });

  it('createEvents generates an id when missing', () => {
    const [a, b] = createEvents([
      { title: 'a', start: '2026-05-25' },
      { title: 'b', start: '2026-05-26' },
    ]);
    expect(a.id).toMatch(/^\{generated-\d+\}$/);
    expect(b.id).toMatch(/^\{generated-\d+\}$/);
    expect(a.id).not.toBe(b.id);
  });

  it('createEvents reads `resourceId` OR `resourceIds`, coerces to strings', () => {
    const [a] = createEvents([{ start: '2026-05-25', resourceId: 7 }]);
    expect(a.resourceIds).toEqual(['7']);

    const [b] = createEvents([{ start: '2026-05-25', resourceIds: [1, 'two'] }]);
    expect(b.resourceIds).toEqual(['1', 'two']);
  });

  it('createEvents infers allDay from string inputs with no time part', () => {
    const [a] = createEvents([{ start: '2026-05-25', end: '2026-05-26' }]);
    expect(a.allDay).toBe(true);
    expect(a.start.getUTCHours()).toBe(0);
  });

  it('createEvents advances allDay end-of-day when end had a time part', () => {
    const [a] = createEvents([{ allDay: true, start: '2026-05-25T00:00', end: '2026-05-25T10:00' }]);
    // setMidnight on end => 2026-05-25T00:00, but original had a time portion,
    // so end is bumped one day forward.
    expect(a.end.getUTCDate()).toBe(26);
  });

  it('createEvents bumps zero-duration allDay (upstream #50)', () => {
    const [a] = createEvents([{ allDay: true, start: '2026-05-25', end: '2026-05-25' }]);
    expect(a.end.getUTCDate()).toBe(26);
  });

  it('createEvents uses event.color as fallback for backgroundColor', () => {
    const [a] = createEvents([{ start: '2026-05-25', color: '#abc' }]);
    expect(a.backgroundColor).toBe('#abc');

    const [b] = createEvents([{ start: '2026-05-25', color: '#abc', backgroundColor: '#def' }]);
    expect(b.backgroundColor).toBe('#def');
  });

  it('createEventSources normalises url, method, extraParams', () => {
    const [s] = createEventSources([{ url: '/events&', method: 'post' }]);
    expect(s.url).toBe('/events');
    expect(s.method).toBe('POST');
    expect(s.extraParams).toEqual({});
    expect(s.events).toBeUndefined();

    const [t] = createEventSources([{ events: [{ start: '2026-05-25' }] }]);
    expect(t.url).toBe('');
    expect(t.method).toBe('GET');
  });

  it('cloneEvent / toEventWithLocalDates produce independent copies', () => {
    const orig = createEvents([{ start: '2026-05-25T09:00', end: '2026-05-25T10:00' }])[0];
    const c = cloneEvent(orig);
    expect(c).not.toBe(orig);
    expect(c.start.getTime()).toBe(orig.start.getTime());
    c.start.setUTCHours(11);
    expect(orig.start.getUTCHours()).toBe(9);

    const local = toEventWithLocalDates(orig);
    expect(local.start instanceof Date).toBe(true);
  });

  it('runReposition trims refs to data.length and calls .reposition() on each', () => {
    const calls = [0, 0, 0];
    const refs = [
      { reposition() { calls[0]++; } },
      { reposition() { calls[1]++; } },
      { reposition() { calls[2]++; } },
    ];
    runReposition(refs, [1, 2]);
    expect(refs.length).toBe(2);
    expect(calls).toEqual([1, 1, 0]);
  });

  it('eventIntersects honours window + optional resource', () => {
    const e = { start: d('2026-05-25T09:00'), end: d('2026-05-25T10:00'), resourceIds: ['r1'] };
    expect(eventIntersects(e, d('2026-05-25T08:00'), d('2026-05-25T09:30'))).toBe(true);
    expect(eventIntersects(e, d('2026-05-25T10:00'), d('2026-05-25T11:00'))).toBe(false);
    expect(eventIntersects(e, d('2026-05-25T00:00'), d('2026-05-26T00:00'), { id: 'r1' })).toBe(true);
    expect(eventIntersects(e, d('2026-05-25T00:00'), d('2026-05-26T00:00'), { id: 'other' })).toBe(false);
  });

  it('display-type predicates', () => {
    expect(bgEvent('background')).toBe(true);
    expect(previewEvent('preview')).toBe(true);
    expect(ghostEvent('ghost')).toBe(true);
    expect(pointerEvent('pointer')).toBe(true);
    expect(bgEvent('auto')).toBe(false);

    expect(helperEvent('preview')).toBeTruthy();
    expect(helperEvent('ghost')).toBeTruthy();
    expect(helperEvent('pointer')).toBeTruthy();
    expect(helperEvent('background')).toBeFalsy();
    expect(helperEvent('auto')).toBeFalsy();
  });

  it('createTimeElement builds a <time> with theme + datetime attribute', () => {
    const chunk = { start: d('2026-05-25T13:30:00') };
    const el = createTimeElement('1:30 PM', chunk, { eventTime: 'ec-event-time' });
    expect(el.tagName).toBe('TIME');
    expect(el.className).toBe('ec-event-time');
    expect(el.innerText).toBe('1:30 PM');
    expect(el.getAttribute('datetime')).toBe('2026-05-25T13:30:00');
  });
});
