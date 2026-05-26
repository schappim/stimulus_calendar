// IANA timezone resolver. Bridges named zones like 'Australia/Sydney' or
// 'America/New_York' to the minutes-east-of-UTC integer that the rest of
// the calendar's offset pipeline expects.
//
// The trick: format the same instant in the target timezone with
// Intl.DateTimeFormat, read back the parts as if they were UTC, and
// subtract. The diff is the timezone's offset for that moment — which
// handles DST automatically (the offset depends on `atDate`).

import { tzOffset } from './utils.js';

// Intl.DateTimeFormat construction is expensive enough on hot paths that
// we cache one formatter per timezone string. `null` is cached for invalid
// names so we don't repeatedly throw + catch.
const formatterCache = new Map();

function getFormatter(timeZone) {
  if (formatterCache.has(timeZone)) return formatterCache.get(timeZone);
  let fmt = null;
  try {
    fmt = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    fmt = null;
  }
  formatterCache.set(timeZone, fmt);
  return fmt;
}

// Resolve an IANA timezone name → minutes-east-of-UTC at `atDate`. Returns
// undefined for invalid names so callers can fall back. DST-aware: pass
// the moment you want the offset for (a calendar that straddles a DST
// transition can re-resolve as the user navigates).
export function ianaOffset(timeZone, atDate = new Date()) {
  const fmt = getFormatter(timeZone);
  if (!fmt) return undefined;
  let year, month, day, hour, minute, second;
  for (const p of fmt.formatToParts(atDate)) {
    switch (p.type) {
      case 'year':   year   = Number(p.value); break;
      case 'month':  month  = Number(p.value); break;
      case 'day':    day    = Number(p.value); break;
      case 'hour':   hour   = Number(p.value); break;
      case 'minute': minute = Number(p.value); break;
      case 'second': second = Number(p.value); break;
    }
  }
  // hourCycle: 'h23' should never emit 24, but some engines historically
  // returned 24 at midnight — normalise.
  if (hour === 24) hour = 0;
  const wallClockUtcMs = Date.UTC(year, month - 1, day, hour, minute, second);
  return Math.round((wallClockUtcMs - atDate.getTime()) / 60000);
}

export function isValidTimeZone(timeZone) {
  if (timeZone == null) return false;
  if (timeZone === 'local' || timeZone === 'UTC') return true;
  return getFormatter(timeZone) != null;
}

// List of common IANA names useful for UI selectors. Not exhaustive —
// callers that need the full IANA database should pull it from
// Intl.supportedValuesOf('timeZone') (where available).
export function commonTimeZones() {
  if (typeof Intl.supportedValuesOf === 'function') {
    try {
      return Intl.supportedValuesOf('timeZone');
    } catch {
      // fall through to the curated list
    }
  }
  return [
    'UTC',
    'Pacific/Auckland',
    'Australia/Sydney',
    'Australia/Melbourne',
    'Australia/Brisbane',
    'Australia/Perth',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Asia/Singapore',
    'Asia/Kolkata',
    'Asia/Dubai',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Europe/Madrid',
    'Europe/Moscow',
    'Africa/Cairo',
    'Africa/Johannesburg',
    'America/Sao_Paulo',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'America/Anchorage',
    'Pacific/Honolulu',
  ];
}

// Re-export for callers that want a single import for everything offset-y.
export { tzOffset };
