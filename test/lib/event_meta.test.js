// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import {
  eventMetaClassNames,
  eventMetaDataAttrs,
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

describe('buildRecurringBadge', () => {
  it('renders a span with the recurring class and aria-hidden', () => {
    const badge = buildRecurringBadge();
    expect(badge.tagName).toBe('SPAN');
    expect(badge.className).toBe('ec-event-recurring');
    expect(badge.getAttribute('aria-hidden')).toBe('true');
    expect(badge.textContent).toBe('🔁');
  });
});
