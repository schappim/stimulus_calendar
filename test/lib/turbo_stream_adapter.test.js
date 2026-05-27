// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { readCalendarEventStream } from '../../src/lib/broadcast/turbo_stream.js';

function parse(html) {
  const wrap = document.createElement('div');
  wrap.innerHTML = html;
  return wrap.firstElementChild;
}

describe('readCalendarEventStream', () => {
  it('hoists kebab-cased attributes to camelCase on the message', () => {
    const el = parse(`<turbo-stream action="calendar-event" op="add"
                                   event-id="42" optimistic-id="opt-99"></turbo-stream>`);
    expect(readCalendarEventStream(el)).toEqual({
      op: 'add',
      eventId: '42',
      optimisticId: 'opt-99',
    });
  });

  it('parses the template JSON as message.event for add/update/remove', () => {
    const el = parse(`<turbo-stream action="calendar-event" op="add" event-id="42">
      <template>${'{"id":"42","title":"Hi","start":"2026-05-15T09:00:00Z"}'}</template>
    </turbo-stream>`);
    const msg = readCalendarEventStream(el);
    expect(msg.op).toBe('add');
    expect(msg.event.id).toBe('42');
    expect(msg.event.title).toBe('Hi');
  });

  it('parses skip-occurrence template into top-level seriesId + date', () => {
    const el = parse(`<turbo-stream action="calendar-event" op="skip-occurrence"
                                   series-id="appt-42" date="2026-06-09">
      <template>${'{"seriesId":"appt-42","date":"2026-06-09"}'}</template>
    </turbo-stream>`);
    const msg = readCalendarEventStream(el);
    expect(msg.op).toBe('skip-occurrence');
    expect(msg.seriesId).toBe('appt-42');
    expect(msg.date).toBe('2026-06-09');
  });

  it('parses override-occurrence template overrides object', () => {
    const el = parse(`<turbo-stream action="calendar-event" op="override-occurrence"
                                   series-id="appt-42" date="2026-06-09">
      <template>${JSON.stringify({
        seriesId: 'appt-42',
        date: '2026-06-09',
        overrides: { title: 'Special site visit', start: '2026-06-09T10:00:00Z' },
      })}</template>
    </turbo-stream>`);
    const msg = readCalendarEventStream(el);
    expect(msg.op).toBe('override-occurrence');
    expect(msg.overrides.title).toBe('Special site visit');
    expect(msg.overrides.start).toBe('2026-06-09T10:00:00Z');
  });

  it('survives a missing or invalid template body', () => {
    const el = parse(`<turbo-stream action="calendar-event" op="refetch"></turbo-stream>`);
    expect(readCalendarEventStream(el)).toEqual({ op: 'refetch' });

    const broken = parse(`<turbo-stream action="calendar-event" op="add">
      <template>not json</template>
    </turbo-stream>`);
    expect(readCalendarEventStream(broken)).toEqual({ op: 'add' });
  });
});
