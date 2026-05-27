import { describe, it, expect } from 'vitest';
import {
  workingWindowForDate,
  offHoursIntervalsForDate,
} from '../../src/lib/working_hours.js';

// Helper — build a local Date for a given ISO YYYY-MM-DD at midnight.
function d(iso) {
  const [y, m, day] = iso.split('-').map(Number);
  return new Date(y, m - 1, day);
}

describe('workingWindowForDate', () => {
  it('returns null when no descriptor or no date is provided', () => {
    expect(workingWindowForDate(null, d('2026-05-25'))).toBeNull();
    expect(workingWindowForDate({}, null)).toBeNull();
  });

  it('returns the default window for a working day', () => {
    // 2026-05-25 is a Monday. daysOfWeek [1..6] includes 1.
    const wh = { daysOfWeek: [1, 2, 3, 4, 5, 6], start: '07:00', end: '16:00' };
    expect(workingWindowForDate(wh, d('2026-05-25'))).toEqual({ startMin: 420, endMin: 960 });
  });

  it('returns a closed window when the day is not in daysOfWeek', () => {
    // 2026-05-24 is a Sunday — not in daysOfWeek [1..6].
    const wh = { daysOfWeek: [1, 2, 3, 4, 5, 6], start: '07:00', end: '16:00' };
    expect(workingWindowForDate(wh, d('2026-05-24'))).toEqual({ startMin: 0, endMin: 0 });
  });

  it('returns a closed window when start / end are invalid or inverted', () => {
    expect(workingWindowForDate({ start: 'oops', end: '16:00' }, d('2026-05-25')))
      .toEqual({ startMin: 0, endMin: 0 });
    // Inverted (end <= start) is invalid: treat as closed all day.
    expect(workingWindowForDate({ start: '16:00', end: '07:00' }, d('2026-05-25')))
      .toEqual({ startMin: 0, endMin: 0 });
  });

  it('overrides[dateStr] replaces the default times', () => {
    const wh = {
      daysOfWeek: [1, 2, 3, 4, 5, 6],
      start: '07:00', end: '16:00',
      overrides: { '2026-06-09': { start: '10:00', end: '14:00' } },
    };
    expect(workingWindowForDate(wh, d('2026-06-09'))).toEqual({ startMin: 600, endMin: 840 });
  });

  it('overrides[dateStr] = null means off the entire day', () => {
    const wh = {
      daysOfWeek: [1, 2, 3, 4, 5, 6],
      start: '07:00', end: '16:00',
      overrides: { '2026-06-09': null },
    };
    expect(workingWindowForDate(wh, d('2026-06-09'))).toEqual({ startMin: 0, endMin: 0 });
  });

  it('overrides win over daysOfWeek (open on a normally-closed day)', () => {
    const wh = {
      daysOfWeek: [1, 2, 3, 4, 5],     // Mon–Fri default
      start: '07:00', end: '16:00',
      overrides: { '2026-05-24': { start: '09:00', end: '13:00' } },  // Sun open
    };
    expect(workingWindowForDate(wh, d('2026-05-24'))).toEqual({ startMin: 540, endMin: 780 });
  });
});

describe('offHoursIntervalsForDate', () => {
  it('returns no off-hours when there is no descriptor', () => {
    expect(offHoursIntervalsForDate(null, d('2026-05-25'))).toEqual([]);
  });

  it('returns two bands (pre-open + post-close) for a normal working day', () => {
    const wh = { daysOfWeek: [1, 2, 3, 4, 5, 6], start: '07:00', end: '16:00' };
    expect(offHoursIntervalsForDate(wh, d('2026-05-25'))).toEqual([
      { startMin: 0,   endMin: 420 },
      { startMin: 960, endMin: 1440 },
    ]);
  });

  it('returns a single full-day band when closed', () => {
    const wh = { daysOfWeek: [1, 2, 3, 4, 5, 6], start: '07:00', end: '16:00' };
    expect(offHoursIntervalsForDate(wh, d('2026-05-24'))).toEqual([
      { startMin: 0, endMin: 1440 },
    ]);
  });

  it('omits the pre-open band when start === 00:00', () => {
    const wh = { daysOfWeek: [0, 1, 2, 3, 4, 5, 6], start: '00:00', end: '16:00' };
    expect(offHoursIntervalsForDate(wh, d('2026-05-25'))).toEqual([
      { startMin: 960, endMin: 1440 },
    ]);
  });

  it('omits the post-close band when end === 24:00 (00:00 next day)', () => {
    const wh = { daysOfWeek: [0, 1, 2, 3, 4, 5, 6], start: '07:00', end: '24:00' };
    expect(offHoursIntervalsForDate(wh, d('2026-05-25'))).toEqual([
      { startMin: 0, endMin: 420 },
    ]);
  });

  it('returns an empty array for a 24-hour open day', () => {
    const wh = { daysOfWeek: [0, 1, 2, 3, 4, 5, 6], start: '00:00', end: '24:00' };
    expect(offHoursIntervalsForDate(wh, d('2026-05-25'))).toEqual([]);
  });

  it('respects overrides — late-start day yields a wider pre-open band', () => {
    const wh = {
      daysOfWeek: [1, 2, 3, 4, 5, 6],
      start: '07:00', end: '16:00',
      overrides: { '2026-06-09': { start: '10:00', end: '14:00' } },
    };
    expect(offHoursIntervalsForDate(wh, d('2026-06-09'))).toEqual([
      { startMin: 0,   endMin: 600 },
      { startMin: 840, endMin: 1440 },
    ]);
  });
});
