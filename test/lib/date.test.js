import { describe, it, expect } from 'vitest';
import {
  DAY_IN_SECONDS,
  createDate, parseTimestamp, cloneDate,
  addDuration, subtractDuration, addDay, subtractDay,
  setMidnight, setStartOfDay,
  toLocalDate, toISOString,
  datesEqual,
  nextClosestDay, prevClosestDay,
  noTimePart, copyTime,
  toSeconds,
  nextDate, prevDate,
  getWeekNumber, createWeekNumberContent,
  parseOffset, applyOffsetDiff,
  setOffset, getOffset,
} from '../../src/lib/date.js';

const d = (iso) => createDate(iso);

describe('lib/date', () => {
  it('DAY_IN_SECONDS', () => {
    expect(DAY_IN_SECONDS).toBe(86400);
  });

  it('createDate / parseTimestamp accept ISO strings and Date instances', () => {
    expect(d('2026-05-25').getUTCFullYear()).toBe(2026);
    expect(d('2026-05-25T13:30:00').getUTCHours()).toBe(13);
    expect(parseTimestamp).toBe(createDate);
    const localDate = new Date(2026, 4, 25, 13, 30, 0);
    const fromLocal = createDate(localDate);
    expect(fromLocal.getUTCHours()).toBe(13);
  });

  it('cloneDate copies time and stored offset', () => {
    const a = d('2026-05-25T00:00:00+10:00');
    const b = cloneDate(a);
    expect(b).not.toBe(a);
    expect(b.getTime()).toBe(a.getTime());
    expect(getOffset(b)).toBe(getOffset(a));
  });

  it('addDuration / subtractDuration honour years, months, days, seconds', () => {
    const x = d('2026-05-25');
    addDuration(x, { years: 1, months: 2, days: 3, seconds: 4 * 3600 });
    expect(x.getUTCFullYear()).toBe(2027);
    expect(x.getUTCMonth()).toBe(6);
    expect(x.getUTCDate()).toBe(28);
    expect(x.getUTCHours()).toBe(4);

    subtractDuration(x, { years: 0, months: 2, days: 3, seconds: 4 * 3600 });
    expect(x.getUTCFullYear()).toBe(2027);
    expect(x.getUTCMonth()).toBe(4);
  });

  it('addDay / subtractDay step UTC date', () => {
    const x = d('2026-05-25');
    addDay(x); expect(x.getUTCDate()).toBe(26);
    subtractDay(x, 2); expect(x.getUTCDate()).toBe(24);
  });

  it('setMidnight / setStartOfDay zero the time', () => {
    const x = d('2026-05-25T13:30:45');
    setMidnight(x);
    expect(x.getUTCHours()).toBe(0);
    expect(x.getUTCMinutes()).toBe(0);
    expect(x.getUTCSeconds()).toBe(0);
    expect(setStartOfDay).toBe(setMidnight);
  });

  it('toLocalDate / toISOString round-trip', () => {
    const x = d('2026-05-25T13:30:00');
    const local = toLocalDate(x);
    expect(local instanceof Date).toBe(true);
    expect(local.getFullYear()).toBe(2026);
    expect(toISOString(x).startsWith('2026-05-25T13:30:00')).toBe(true);
    expect(toISOString(x, 10)).toBe('2026-05-25');
  });

  it('datesEqual checks getTime equality across multiple dates', () => {
    const a = d('2026-05-25T00:00:00');
    const b = d('2026-05-25T00:00:00');
    const c = d('2026-05-26T00:00:00');
    expect(datesEqual(a, b)).toBe(true);
    expect(datesEqual(a, b, c)).toBe(false);
  });

  it('nextClosestDay / prevClosestDay walk to the requested weekday', () => {
    // 2026-05-25 is a Monday (getUTCDay === 1).
    const mon = d('2026-05-25');
    expect(mon.getUTCDay()).toBe(1);
    nextClosestDay(cloneDate(mon), 5);  // Friday
    // Should be Friday of the same week.
    const fri = nextClosestDay(cloneDate(mon), 5);
    expect(fri.getUTCDay()).toBe(5);
    expect(fri.getUTCDate()).toBe(29);

    const prevSun = prevClosestDay(cloneDate(mon), 0);
    expect(prevSun.getUTCDay()).toBe(0);
    expect(prevSun.getUTCDate()).toBe(24);
  });

  it('noTimePart only matches short ISO strings', () => {
    expect(noTimePart('2026-05-25')).toBe(true);
    expect(noTimePart('2026-05-25T00:00:00')).toBe(false);
    expect(noTimePart(new Date())).toBe(false);
  });

  it('copyTime copies time portion only', () => {
    const dst = d('2020-01-01T00:00:00');
    const src = d('2026-05-25T13:30:45');
    copyTime(dst, src);
    expect(dst.getUTCFullYear()).toBe(2020);
    expect(dst.getUTCHours()).toBe(13);
    expect(dst.getUTCMinutes()).toBe(30);
  });

  it('toSeconds returns duration.seconds', () => {
    expect(toSeconds({ seconds: 3600 })).toBe(3600);
  });

  it('nextDate / prevDate skip hidden days', () => {
    // Step day-by-day, hiding Sundays (0) and Saturdays (6).
    const week = { years: 0, months: 0, days: 1, seconds: 0 };
    const fri = d('2026-05-29');  // Friday
    nextDate(fri, week, [0, 6]);  // Saturday hidden → Sunday hidden → lands Monday
    expect(fri.getUTCDay()).toBe(1);
    const monBack = d('2026-06-01');
    prevDate(monBack, week, [0, 6]);
    expect(monBack.getUTCDay()).toBe(5);  // Friday
  });

  it('getWeekNumber (ISO and Western)', () => {
    const may25 = d('2026-05-25');  // ISO week 22 of 2026
    expect(getWeekNumber(may25, 1)).toBe(22);
    expect(getWeekNumber(may25, 0)).toBeGreaterThan(0);
  });

  it('createWeekNumberContent: default vs custom', () => {
    const x = d('2026-05-25');
    expect(createWeekNumberContent(5, undefined, x)).toBe('W05');
    expect(createWeekNumberContent(5, 'Custom', x)).toBe('Custom');
    expect(createWeekNumberContent(5, ({ week }) => `#${week}`, x)).toBe('#5');
  });

  it('parseOffset parses ±HH:MM suffixes', () => {
    expect(parseOffset('2026-05-25T00:00:00+10:00')).toBe(600);
    expect(parseOffset('2026-05-25T00:00:00-05:30')).toBe(-330);
    expect(parseOffset('2026-05-25T00:00:00')).toBeUndefined();
  });

  it('applyOffsetDiff shifts UTC minutes', () => {
    const x = d('2026-05-25T00:00:00');
    applyOffsetDiff(x, 60);
    expect(x.getUTCHours()).toBe(1);
  });

  it('setOffset / getOffset store metadata on the date', () => {
    const x = new Date();
    setOffset(x, 600);
    expect(getOffset(x)).toBe(600);
  });
});
