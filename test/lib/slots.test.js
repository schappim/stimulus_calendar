import { describe, it, expect } from 'vitest';
import { createSlots, createSlotTimeLimits } from '../../src/lib/slots.js';
import { createDate, addDuration } from '../../src/lib/date.js';
import { createDuration } from '../../src/lib/duration.js';

// A minimal Intl-shaped formatter for test isolation.
const intlHHMM = {
  format(d) {
    const h = String(d.getUTCHours()).padStart(2, '0');
    const m = String(d.getUTCMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  },
};

describe('lib/slots', () => {
  it('createSlots builds [iso, label] pairs at slotDuration intervals', () => {
    const day = createDate('2026-05-25T00:00:00');
    const slotDuration = createDuration('00:30');  // 30 minutes
    const slotLabelPeriodicity = 1;
    const limits = {
      min: createDuration({ hours: 8 }),   // 08:00
      max: createDuration({ hours: 10 }),  // 10:00
    };
    const slots = createSlots(day, slotDuration, slotLabelPeriodicity, limits, intlHHMM);
    expect(slots).toEqual([
      [expect.stringMatching(/2026-05-25T08:00:00/), '08:00'],
      [expect.stringMatching(/2026-05-25T08:30:00/), '08:30'],
      [expect.stringMatching(/2026-05-25T09:00:00/), '09:00'],
      [expect.stringMatching(/2026-05-25T09:30:00/), '09:30'],
    ]);
  });

  it('createSlots with periodicity > 1 jumps by N slots per label', () => {
    const day = createDate('2026-05-25T00:00:00');
    const slotDuration = createDuration('00:30');
    const slotLabelPeriodicity = 2;  // labels every hour
    const limits = {
      min: createDuration({ hours: 8 }),
      max: createDuration({ hours: 10 }),
    };
    const slots = createSlots(day, slotDuration, slotLabelPeriodicity, limits, intlHHMM);
    expect(slots.map(([_iso, label]) => label)).toEqual(['08:00', '09:00']);
  });

  it('createSlotTimeLimits returns input bounds when not flexible', () => {
    const result = createSlotTimeLimits('06:00', '18:00', false, [], []);
    expect(result.min).toEqual(createDuration('06:00'));
    expect(result.max).toEqual(createDuration('18:00'));
  });

  it('createSlotTimeLimits expands max to fit an event running past end', () => {
    const day = createDate('2026-05-25T00:00:00');
    const event = {
      start: createDate('2026-05-25T17:00:00'),
      end:   createDate('2026-05-25T20:00:00'),
      allDay: false,
      display: 'auto',
    };
    const result = createSlotTimeLimits('08:00', '18:00', true, [day], [event]);
    // Max should expand to 20:00 = 72_000 seconds.
    expect(result.max.seconds).toBe(20 * 3600);
    expect(result.min.seconds).toBe(8 * 3600);  // unchanged
  });

  it('createSlotTimeLimits expands min when event starts before it', () => {
    const day = createDate('2026-05-25T00:00:00');
    const event = {
      start: createDate('2026-05-25T05:00:00'),
      end:   createDate('2026-05-25T06:00:00'),
      allDay: false,
      display: 'auto',
    };
    const result = createSlotTimeLimits('08:00', '18:00', true, [day], [event]);
    expect(result.min.seconds).toBe(5 * 3600);
  });

  it('createSlotTimeLimits skips allDay and background events', () => {
    const day = createDate('2026-05-25T00:00:00');
    const events = [
      { start: createDate('2026-05-25T05:00:00'), end: createDate('2026-05-25T20:00:00'),
        allDay: true, display: 'auto' },
      { start: createDate('2026-05-25T05:00:00'), end: createDate('2026-05-25T20:00:00'),
        allDay: false, display: 'background' },
    ];
    const result = createSlotTimeLimits('08:00', '18:00', true, [day], events);
    expect(result.min.seconds).toBe(8 * 3600);
    expect(result.max.seconds).toBe(18 * 3600);
  });

  it('createSlotTimeLimits honours a custom flexibleSlotTimeLimits.eventFilter', () => {
    const day = createDate('2026-05-25T00:00:00');
    const events = [
      { id: '1', start: createDate('2026-05-25T05:00:00'), end: createDate('2026-05-25T06:00:00'),
        allDay: false, display: 'auto' },
    ];
    const result = createSlotTimeLimits(
      '08:00', '18:00',
      { eventFilter: (e) => e.id === '999' },   // excludes our event
      [day],
      events,
    );
    expect(result.min.seconds).toBe(8 * 3600);
  });
});
