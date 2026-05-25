import { describe, it, expect } from 'vitest';
import {
  createDateRange, outsideRange, dateInRange,
  datesInRange, rangesOverlap, intersectRanges,
} from '../../src/lib/range.js';
import { createDate } from '../../src/lib/date.js';

const d = (iso) => createDate(iso);

describe('lib/range', () => {
  it('createDateRange normalises to midnight-of-day', () => {
    const r = createDateRange({ start: '2026-05-25T13:30:00', end: '2026-05-27' });
    expect(r.start.getUTCHours()).toBe(0);
    expect(r.start.getUTCDate()).toBe(25);
    expect(r.end.getUTCDate()).toBe(27);
  });

  it('createDateRange returns {} for missing input', () => {
    expect(createDateRange()).toEqual({});
    expect(createDateRange(null)).toEqual({});
  });

  it('outsideRange respects open bounds', () => {
    const range = { start: d('2026-05-25'), end: d('2026-05-27') };
    expect(outsideRange(d('2026-05-24'), range)).toBeTruthy();
    expect(outsideRange(d('2026-05-26'), range)).toBeFalsy();
    expect(outsideRange(d('2026-05-28'), range)).toBeTruthy();

    // Open-ended (no start).
    const onlyEnd = { end: d('2026-05-27') };
    expect(outsideRange(d('2020-01-01'), onlyEnd)).toBeFalsy();
    expect(outsideRange(d('2026-05-28'), onlyEnd)).toBeTruthy();
  });

  it('dateInRange is the inverse of outsideRange', () => {
    const range = { start: d('2026-05-25'), end: d('2026-05-27') };
    expect(dateInRange(d('2026-05-26'), range)).toBe(true);
    expect(dateInRange(d('2026-05-28'), range)).toBe(false);
  });

  it('datesInRange enumerates day-by-day, half-open', () => {
    const r = createDateRange({ start: '2026-05-25', end: '2026-05-28' });
    const days = datesInRange(r);
    expect(days.map((dt) => dt.getUTCDate())).toEqual([25, 26, 27]);
  });

  it('datesInRange throws on missing bounds', () => {
    expect(() => datesInRange({ start: new Date() })).toThrow();
    expect(() => datesInRange({})).toThrow();
  });

  it('rangesOverlap covers half-open semantics', () => {
    const a = { start: d('2026-05-25'), end: d('2026-05-27') };
    const b = { start: d('2026-05-26'), end: d('2026-05-28') };
    const c = { start: d('2026-05-27'), end: d('2026-05-28') }; // touches end of a
    expect(rangesOverlap(a, b)).toBe(true);
    expect(rangesOverlap(a, c)).toBe(false);  // a.end === c.start

    // Open bounds.
    expect(rangesOverlap({ start: d('2020-01-01') }, { end: d('2030-01-01') })).toBe(true);
    expect(rangesOverlap({ end: d('2026-01-01') }, { start: d('2026-02-01') })).toBe(false);
  });

  it('intersectRanges narrows to the inner window', () => {
    const a = { start: d('2026-05-25'), end: d('2026-05-28') };
    const b = { start: d('2026-05-26'), end: d('2026-05-30') };
    const intersection = intersectRanges(a, b);
    expect(intersection.start.getUTCDate()).toBe(26);
    expect(intersection.end.getUTCDate()).toBe(28);

    expect(intersectRanges(
      { end: d('2026-01-01') },
      { start: d('2026-02-01') },
    )).toBeNull();
  });
});
