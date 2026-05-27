// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import {
  eventMetaClassNames,
  eventMetaDataAttrs,
  resolveEventType,
  eventMetaSeriesInfo,
  eventMetaAppearClass,
  buildRecurringBadge,
} from '../../src/lib/event_meta.js';

describe('eventMetaClassNames', () => {
  it('returns no classes for a vanilla event', () => {
    expect(eventMetaClassNames({})).toEqual([]);
    expect(eventMetaClassNames({ extendedProps: {} })).toEqual([]);
  });

  it('maps confirmationState onto a paired class', () => {
    expect(eventMetaClassNames({ extendedProps: { confirmationState: 'tentative' } }))
      .toEqual(['ec-event-tentative']);
    expect(eventMetaClassNames({ extendedProps: { confirmationState: 'confirmed' } }))
      .toEqual(['ec-event-confirmed']);
    expect(eventMetaClassNames({ extendedProps: { confirmationState: 'cancelled' } }))
      .toEqual(['ec-event-cancelled']);
  });

  it('adds ec-event-conflict when extendedProps.conflict === true', () => {
    expect(eventMetaClassNames({ extendedProps: { conflict: true } }))
      .toEqual(['ec-event-conflict']);
    // Only the strict `true` triggers — a truthy non-boolean is rejected
    // so callers don't accidentally light up tiles from string data.
    expect(eventMetaClassNames({ extendedProps: { conflict: 'yes' } }))
      .toEqual([]);
  });

  it('adds ec-event-recurring for any truthy rrule', () => {
    expect(eventMetaClassNames({ extendedProps: { rrule: 'FREQ=DAILY' } }))
      .toEqual(['ec-event-recurring']);
    expect(eventMetaClassNames({ extendedProps: { rrule: '' } })).toEqual([]);
  });
});

describe('eventMetaDataAttrs', () => {
  it('returns an empty list when no dataAttrs are declared', () => {
    expect(eventMetaDataAttrs({})).toEqual([]);
    expect(eventMetaDataAttrs({ extendedProps: {} })).toEqual([]);
    expect(eventMetaDataAttrs({ extendedProps: { dataAttrs: null } })).toEqual([]);
  });

  it('kebab-cases camelCase keys and prefixes data-', () => {
    const out = eventMetaDataAttrs({
      extendedProps: {
        dataAttrs: { aiContextType: 'job', jobId: 1042 },
      },
    });
    expect(out).toEqual([
      ['data-ai-context-type', 'job'],
      ['data-job-id', '1042'],
    ]);
  });

  it('passes through pre-kebab-cased keys unchanged after prefixing', () => {
    const out = eventMetaDataAttrs({
      extendedProps: { dataAttrs: { 'ai-context-type': 'job' } },
    });
    expect(out).toEqual([['data-ai-context-type', 'job']]);
  });

  it('passes through keys that already have the data- prefix', () => {
    const out = eventMetaDataAttrs({
      extendedProps: { dataAttrs: { 'data-test-id': 'tile-42' } },
    });
    expect(out).toEqual([['data-test-id', 'tile-42']]);
  });

  it('coerces numbers and booleans to strings', () => {
    const out = eventMetaDataAttrs({
      extendedProps: { dataAttrs: { count: 3, pinned: true, draft: false } },
    });
    expect(out).toEqual([
      ['data-count', '3'],
      ['data-pinned', 'true'],
      ['data-draft', 'false'],
    ]);
  });

  it('skips null and undefined values', () => {
    const out = eventMetaDataAttrs({
      extendedProps: { dataAttrs: { a: 'x', b: null, c: undefined, d: 'y' } },
    });
    expect(out).toEqual([
      ['data-a', 'x'],
      ['data-d', 'y'],
    ]);
  });

  it('skips object and array values (no faithful primitive serialisation)', () => {
    const out = eventMetaDataAttrs({
      extendedProps: {
        dataAttrs: { ok: 'x', bad: { nested: 1 }, alsoBad: [1, 2] },
      },
    });
    expect(out).toEqual([['data-ok', 'x']]);
  });

  it('rejects keys with chars HTML wouldn\'t accept on a data attribute', () => {
    const out = eventMetaDataAttrs({
      extendedProps: {
        dataAttrs: {
          'a b': 'space-key',          // whitespace
          'good': 'yes',
          'a"b': 'quote-key',          // quote char
          'a=b': 'equals-key',         // equals char
        },
      },
    });
    expect(out).toEqual([['data-good', 'yes']]);
  });

  it('survives null event input', () => {
    expect(eventMetaDataAttrs(null)).toEqual([]);
    expect(eventMetaDataAttrs(undefined)).toEqual([]);
  });
});

describe('resolveEventType', () => {
  const eventTypes = {
    job:         { color: '#f59e0b', classNames: ['ec-event-job'], label: 'Job', icon: 'wrench' },
    quote_visit: { color: '#6366f1', classNames: 'ec-event-quote-visit', label: 'Quote visit' },
    bare:        { color: '#000' },
  };

  it('returns null when extendedProps.type is missing', () => {
    expect(resolveEventType({}, { eventTypes })).toBeNull();
    expect(resolveEventType({ extendedProps: {} }, { eventTypes })).toBeNull();
  });

  it('returns null when no eventTypes map is configured', () => {
    expect(resolveEventType({ extendedProps: { type: 'job' } }, {})).toBeNull();
    expect(resolveEventType({ extendedProps: { type: 'job' } }, { eventTypes: null })).toBeNull();
  });

  it('returns null when the type is not in the map', () => {
    expect(resolveEventType({ extendedProps: { type: 'unknown' } }, { eventTypes })).toBeNull();
  });

  it('resolves a full descriptor and auto-prefixes the ec-event-type-{slug} class', () => {
    expect(resolveEventType({ extendedProps: { type: 'job' } }, { eventTypes })).toEqual({
      type: 'job',
      color: '#f59e0b',
      classNames: ['ec-event-type-job', 'ec-event-job'],
      label: 'Job',
      icon: 'wrench',
    });
  });

  it('coerces a string classNames into a one-element array', () => {
    expect(resolveEventType({ extendedProps: { type: 'quote_visit' } }, { eventTypes }))
      .toEqual({
        type: 'quote_visit',
        color: '#6366f1',
        classNames: ['ec-event-type-quote-visit', 'ec-event-quote-visit'],
        label: 'Quote visit',
        icon: null,
      });
  });

  it('returns just the auto-class when the descriptor has no classNames', () => {
    expect(resolveEventType({ extendedProps: { type: 'bare' } }, { eventTypes }))
      .toEqual({
        type: 'bare',
        color: '#000',
        classNames: ['ec-event-type-bare'],
        label: null,
        icon: null,
      });
  });

  it('slugifies underscores / dots / spaces in the type key', () => {
    const out = resolveEventType(
      { extendedProps: { type: 'Service Call' } },
      { eventTypes: { 'Service Call': { color: '#3b82f6' } } },
    );
    expect(out.classNames).toEqual(['ec-event-type-service-call']);
  });

  it('does not duplicate the auto-class when the host already declares it', () => {
    const out = resolveEventType(
      { extendedProps: { type: 'job' } },
      { eventTypes: { job: { classNames: ['ec-event-type-job', 'extra'] } } },
    );
    expect(out.classNames).toEqual(['ec-event-type-job', 'extra']);
  });
});

describe('eventMetaAppearClass', () => {
  it('returns null when the event id is not in the pending set', () => {
    expect(eventMetaAppearClass({ id: '1' }, { eventAppearAnimation: 'fly-in' }, new Set()))
      .toBeNull();
  });

  it('returns the appear class when the id is pending — purely a read, no mutation', () => {
    const pending = new Set(['1']);
    const event = { id: '1' };
    const opts = { eventAppearAnimation: 'fly-in' };
    expect(eventMetaAppearClass(event, opts, pending)).toBe('ec-event-appear-fly-in');
    // Idempotent — re-reading the same pending set returns the same class.
    expect(eventMetaAppearClass(event, opts, pending)).toBe('ec-event-appear-fly-in');
    // The helper does NOT mutate the set.
    expect(pending.has('1')).toBe(true);
  });

  it('extendedProps.appearAnimation overrides the calendar-wide default', () => {
    const pending = new Set(['1']);
    const event = { id: '1', extendedProps: { appearAnimation: 'highlight-pulse' } };
    const opts = { eventAppearAnimation: 'fly-in' };
    expect(eventMetaAppearClass(event, opts, pending)).toBe('ec-event-appear-highlight-pulse');
  });

  it('rejects names containing characters that would corrupt CSS class serialisation', () => {
    const pending = new Set(['1']);
    const opts = { eventAppearAnimation: 'fly in" />' };
    expect(eventMetaAppearClass({ id: '1' }, opts, pending)).toBeNull();
  });

  it('returns null when no animation is configured even if the id is pending', () => {
    const pending = new Set(['1']);
    expect(eventMetaAppearClass({ id: '1' }, {}, pending)).toBeNull();
  });

  it('survives missing event, pendingSet, or id without throwing', () => {
    expect(eventMetaAppearClass(null, {}, new Set())).toBeNull();
    expect(eventMetaAppearClass({ id: '1' }, {}, null)).toBeNull();
    expect(eventMetaAppearClass({}, { eventAppearAnimation: 'fly-in' }, new Set())).toBeNull();
  });
});

describe('eventMetaSeriesInfo', () => {
  it('reports a non-series event when no recurrence breadcrumbs are present', () => {
    expect(eventMetaSeriesInfo({})).toEqual({ isSeriesMember: false, seriesId: null });
    expect(eventMetaSeriesInfo({ extendedProps: {} }))
      .toEqual({ isSeriesMember: false, seriesId: null });
  });

  it('detects a recurring master via extendedProps.rrule and uses its id as seriesId', () => {
    expect(eventMetaSeriesInfo({ id: 'appt-42', extendedProps: { rrule: 'FREQ=WEEKLY' } }))
      .toEqual({ isSeriesMember: true, seriesId: 'appt-42' });
  });

  it('detects a host-expanded occurrence via extendedProps.series.id', () => {
    expect(eventMetaSeriesInfo({
      id: 'appt-42-2026-06-01',
      extendedProps: { series: { id: 'appt-42', instance: 3 } },
    })).toEqual({ isSeriesMember: true, seriesId: 'appt-42' });
  });

  it('series.id wins over rrule when both are declared', () => {
    expect(eventMetaSeriesInfo({
      id: 'master',
      extendedProps: { rrule: 'FREQ=DAILY', series: { id: 'real-master' } },
    })).toEqual({ isSeriesMember: true, seriesId: 'real-master' });
  });

  it('survives null / undefined event', () => {
    expect(eventMetaSeriesInfo(null)).toEqual({ isSeriesMember: false, seriesId: null });
    expect(eventMetaSeriesInfo(undefined)).toEqual({ isSeriesMember: false, seriesId: null });
  });
});

describe('buildRecurringBadge', () => {
  it('renders a span with the recurring class and aria-hidden', () => {
    const badge = buildRecurringBadge();
    expect(badge.tagName).toBe('SPAN');
    expect(badge.className).toBe('ec-event-recurring');
    expect(badge.getAttribute('aria-hidden')).toBe('true');
    expect(badge.textContent).toBe('🔁');
  });
});
