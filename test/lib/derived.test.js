import { describe, it, expect } from 'vitest';
import {
  intl, intlRange,
  currentRange, activeRange, viewDates, viewTitle,
  filteredEvents, offset, view,
} from '../../src/lib/derived.js';
import { createDate } from '../../src/lib/date.js';
import { createDuration } from '../../src/lib/duration.js';

const d = (iso) => createDate(iso);

describe('lib/derived', () => {
  describe('intl / intlRange', () => {
    it('intl wraps Intl.DateTimeFormat', () => {
      const fmt = intl('en-AU', { year: 'numeric', month: 'short' });
      const str = fmt.format(new Date(Date.UTC(2026, 4, 25)));
      expect(str).toMatch(/2026/);
    });

    it('intl accepts a function and returns it as-is', () => {
      const fmt = intl('en-AU', (date) => 'X:' + date.getUTCFullYear());
      expect(fmt.format(new Date(Date.UTC(2026, 0, 1)))).toBe('X:2026');
    });

    it('intlRange wraps Intl.DateTimeFormat#formatRange', () => {
      const fmt = intlRange('en-AU', { year: 'numeric', month: 'short', day: 'numeric' });
      const str = fmt.formatRange(
        new Date(Date.UTC(2026, 4, 25)),
        new Date(Date.UTC(2026, 4, 27)),
      );
      expect(str.length).toBeGreaterThan(0);
    });
  });

  describe('currentRange', () => {
    it('snaps year-duration to Jan 1', () => {
      const r = currentRange(d('2026-05-25'), createDuration({ years: 1 }), 0);
      expect(r.start.getUTCMonth()).toBe(0);
      expect(r.start.getUTCDate()).toBe(1);
    });

    it('snaps month-duration to the 1st', () => {
      const r = currentRange(d('2026-05-25'), createDuration({ months: 1 }), 0);
      expect(r.start.getUTCDate()).toBe(1);
      expect(r.start.getUTCMonth()).toBe(4);
    });

    it('snaps weeks-duration to the closest previous firstDay', () => {
      // 2026-05-25 is a Monday; with firstDay=1 (Mon), start stays;
      // with firstDay=0 (Sun), start jumps back to Sunday the 24th.
      const monAnchor = createDuration({ weeks: 1 });
      const r1 = currentRange(d('2026-05-25'), monAnchor, 1);
      expect(r1.start.getUTCDate()).toBe(25);
      const r2 = currentRange(d('2026-05-25'), monAnchor, 0);
      expect(r2.start.getUTCDate()).toBe(24);
    });

    it('day-duration leaves the anchor untouched', () => {
      const r = currentRange(d('2026-05-25T13:30:00'), createDuration({ days: 1 }), 0);
      expect(r.start.getUTCDate()).toBe(25);
      expect(r.end.getUTCDate()).toBe(26);
    });
  });

  describe('activeRange', () => {
    it('returns a copy when no extension is provided', () => {
      const cr = { start: d('2026-05-25'), end: d('2026-05-26') };
      const ar = activeRange(cr);
      expect(ar).not.toBe(cr);
      expect(ar.start.getUTCDate()).toBe(25);
      expect(ar.end.getUTCDate()).toBe(26);
    });

    it('passes through an extension', () => {
      const ext = (s, e) => ({ start: s, end: e });
      const cr = { start: d('2026-05-25'), end: d('2026-05-26') };
      expect(activeRange(cr, ext).start.getUTCDate()).toBe(25);
    });
  });

  describe('viewDates', () => {
    it('enumerates day-by-day, skipping hiddenDays', () => {
      const ar = { start: d('2026-05-25'), end: d('2026-05-31') };  // Mon..Sat
      const days = viewDates(ar, []);
      expect(days.length).toBe(6);
      const noWeekends = viewDates(ar, [0, 6]);
      expect(noWeekends.length).toBe(5);  // Mon..Fri
    });
  });

  describe('viewTitle', () => {
    it('formats the inclusive range start..(end-1) via intlRange', () => {
      const intlT = {
        formatRange: (s, e) => `${s.getUTCDate()}–${e.getUTCDate()}`,
      };
      const cr = { start: d('2026-05-25'), end: d('2026-05-28') };
      expect(viewTitle(intlT, cr)).toBe('25–27');
    });
  });

  describe('filteredEvents', () => {
    const ev = (id, start, allDay = false) => ({
      id, start: d(start), end: d(start), allDay, resourceIds: [],
    });

    it('sorts by start ascending, all-day floats up on ties', () => {
      const events = [
        ev('1', '2026-05-25T10:00'),
        ev('2', '2026-05-25T09:00'),
        ev('3', '2026-05-25T09:00', true),
      ];
      const view = { type: 'timeGridDay' };
      const r = filteredEvents(events, view, {});
      expect(r.map((e) => e.id)).toEqual(['3', '2', '1']);
    });

    it('applies eventFilter (receives local-date views)', () => {
      const events = [ev('1', '2026-05-25T09:00'), ev('2', '2026-05-25T10:00')];
      const view = {
        type: 'timeGridDay',
        currentStart: d('2026-05-25'), currentEnd: d('2026-05-26'),
        activeStart:  d('2026-05-25'), activeEnd:  d('2026-05-26'),
      };
      const r = filteredEvents(events, view, {
        eventFilter: ({ event }) => event.id === '2',
      });
      expect(r.map((e) => e.id)).toEqual(['2']);
    });

    it('filterEventsWithResources requires resource intersection', () => {
      const events = [
        { id: '1', start: d('2026-05-25T09:00'), end: d('2026-05-25T10:00'), resourceIds: ['r1'], allDay: false },
        { id: '2', start: d('2026-05-25T09:00'), end: d('2026-05-25T10:00'), resourceIds: ['gone'], allDay: false },
      ];
      const view = { type: 'timeGridDay' };
      const r = filteredEvents(events, view, {
        filterEventsWithResources: true,
        resources: [{ id: 'r1' }],
      });
      expect(r.map((e) => e.id)).toEqual(['1']);
    });
  });

  describe('offset', () => {
    it("returns 0 for 'UTC'", () => {
      expect(offset('UTC')).toBe(0);
    });
    it("returns parseOffset() for '+HH:MM'", () => {
      expect(offset('+10:00')).toBe(600);
      expect(offset('-05:30')).toBe(-330);
    });
    it("returns a number for 'local'", () => {
      expect(typeof offset('local')).toBe('number');
    });
  });

  describe('view', () => {
    it('builds the same shape as createView', () => {
      const v = view(
        'dayGridMonth',
        'May 2026',
        { start: d('2026-05-01'), end: d('2026-06-01') },
        { start: d('2026-04-26'), end: d('2026-06-07') },
      );
      expect(v.type).toBe('dayGridMonth');
      expect(v.title).toBe('May 2026');
    });
  });
});
