import { describe, it, expect } from 'vitest';
import { ianaOffset, isValidTimeZone, commonTimeZones } from '../../src/lib/tz.js';

// UTC instants chosen to land cleanly on each hemisphere's DST half.
// 2026 chosen to match the rest of the test suite.
const JAN_SUMMER_SOUTH = new Date(Date.UTC(2026, 0, 15, 12, 0, 0));  // S-summer / N-winter
const JUL_SUMMER_NORTH = new Date(Date.UTC(2026, 6, 15, 12, 0, 0));  // N-summer / S-winter

describe('lib/tz', () => {
  describe('ianaOffset', () => {
    it("returns the static offset for non-DST zones", () => {
      // Brisbane is +10:00 year-round (no DST in Queensland).
      expect(ianaOffset('Australia/Brisbane', JAN_SUMMER_SOUTH)).toBe(600);
      expect(ianaOffset('Australia/Brisbane', JUL_SUMMER_NORTH)).toBe(600);
    });

    it('honours DST for Australia/Sydney', () => {
      // Sydney: AEDT +11:00 in southern summer, AEST +10:00 in southern winter.
      expect(ianaOffset('Australia/Sydney', JAN_SUMMER_SOUTH)).toBe(660);
      expect(ianaOffset('Australia/Sydney', JUL_SUMMER_NORTH)).toBe(600);
    });

    it('honours DST for America/New_York', () => {
      // EST -05:00 in winter, EDT -04:00 in summer.
      expect(ianaOffset('America/New_York', JAN_SUMMER_SOUTH)).toBe(-300);
      expect(ianaOffset('America/New_York', JUL_SUMMER_NORTH)).toBe(-240);
    });

    it('honours DST for Europe/London', () => {
      // GMT 0 in winter, BST +01:00 in summer.
      expect(ianaOffset('Europe/London', JAN_SUMMER_SOUTH)).toBe(0);
      expect(ianaOffset('Europe/London', JUL_SUMMER_NORTH)).toBe(60);
    });

    it("returns 0 for 'UTC'", () => {
      expect(ianaOffset('UTC', JAN_SUMMER_SOUTH)).toBe(0);
      expect(ianaOffset('UTC', JUL_SUMMER_NORTH)).toBe(0);
    });

    it('handles fractional offsets (Asia/Kolkata = +05:30)', () => {
      expect(ianaOffset('Asia/Kolkata', JAN_SUMMER_SOUTH)).toBe(330);
      expect(ianaOffset('Asia/Kolkata', JUL_SUMMER_NORTH)).toBe(330);
    });

    it('returns undefined for invalid names', () => {
      expect(ianaOffset('Not/A/Zone', JAN_SUMMER_SOUTH)).toBeUndefined();
      expect(ianaOffset('', JAN_SUMMER_SOUTH)).toBeUndefined();
    });

    it('defaults atDate to now()', () => {
      // Just smoke-test that omitting atDate doesn't throw and returns a number.
      expect(typeof ianaOffset('Australia/Sydney')).toBe('number');
    });
  });

  describe('isValidTimeZone', () => {
    it("treats 'local' and 'UTC' as valid", () => {
      expect(isValidTimeZone('local')).toBe(true);
      expect(isValidTimeZone('UTC')).toBe(true);
    });

    it('accepts IANA names the runtime knows about', () => {
      expect(isValidTimeZone('Australia/Sydney')).toBe(true);
      expect(isValidTimeZone('America/Los_Angeles')).toBe(true);
    });

    it('rejects bogus names', () => {
      expect(isValidTimeZone('Atlantis/Lost')).toBe(false);
      expect(isValidTimeZone('')).toBe(false);
      expect(isValidTimeZone(undefined)).toBe(false);
      expect(isValidTimeZone(null)).toBe(false);
    });
  });

  describe('commonTimeZones', () => {
    it('returns an array of valid zone names', () => {
      const zones = commonTimeZones();
      expect(Array.isArray(zones)).toBe(true);
      expect(zones.length).toBeGreaterThan(0);
      // Every returned zone must round-trip through isValidTimeZone.
      for (const z of zones.slice(0, 10)) {
        expect(isValidTimeZone(z)).toBe(true);
      }
    });
  });
});
