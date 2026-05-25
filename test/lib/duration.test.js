import { describe, it, expect } from 'vitest';
import {
  createDuration, parseDuration,
  durationDays, durationToSeconds, addDurationToDate,
} from '../../src/lib/duration.js';
import { createDate } from '../../src/lib/date.js';

describe('lib/duration', () => {
  it('createDuration from seconds (number)', () => {
    expect(createDuration(120)).toEqual({
      years: 0, months: 0, days: 0, seconds: 120, inWeeks: false,
    });
  });

  it('createDuration from "hh:mm:ss" string', () => {
    expect(createDuration('1:30:45')).toEqual({
      years: 0, months: 0, days: 0, seconds: 3600 + 30 * 60 + 45, inWeeks: false,
    });
    expect(createDuration('2')).toMatchObject({ seconds: 7200 });
    expect(createDuration('2:15')).toMatchObject({ seconds: 7200 + 900 });
  });

  it('createDuration from a Date (UTC hh/mm/ss)', () => {
    const date = new Date(Date.UTC(2026, 0, 1, 4, 5, 6));
    expect(createDuration(date)).toEqual({
      years: 0, months: 0, days: 0,
      seconds: 4 * 3600 + 5 * 60 + 6,
      inWeeks: false,
    });
  });

  it('createDuration from an object with mixed singular/plural keys', () => {
    expect(createDuration({ year: 1, months: 2, weeks: 1, day: 3, hour: 2 })).toEqual({
      years: 1,
      months: 2,
      days: 7 + 3,
      seconds: 7200,
      inWeeks: true,
    });
  });

  it('parseDuration is an alias for createDuration', () => {
    expect(parseDuration).toBe(createDuration);
  });

  it('durationDays counts days only (years/months excluded)', () => {
    expect(durationDays(createDuration({ years: 1, months: 1, days: 5 }))).toBe(5);
    expect(durationDays(createDuration({ weeks: 2 }))).toBe(14);
  });

  it('durationToSeconds sums days * 86400 + seconds', () => {
    expect(durationToSeconds(createDuration({ days: 1, hours: 1 }))).toBe(86400 + 3600);
    expect(durationToSeconds(createDuration({ weeks: 1 }))).toBe(7 * 86400);
  });

  it('addDurationToDate delegates to date.addDuration', () => {
    const d = createDate('2026-05-25T00:00:00');
    addDurationToDate(d, createDuration({ days: 2, hours: 3 }));
    expect(d.getUTCDate()).toBe(27);
    expect(d.getUTCHours()).toBe(3);

    addDurationToDate(d, createDuration({ days: 1 }), -1);
    expect(d.getUTCDate()).toBe(26);
  });
});
