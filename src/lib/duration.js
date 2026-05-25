// Port of duration parsing extracted from
// calendar/packages/core/src/lib/date.js (upstream keeps it inlined).
// Per PLAN.md, lives in its own module so date.js stays focused on dates.

import { isDate } from './utils.js';
import { addDuration, DAY_IN_SECONDS } from './date.js';

// Parse a duration input. Accepts:
//   - number   →  treated as seconds
//   - string   →  'hh[:mm[:ss]]'
//   - Date     →  UTC hours/minutes/seconds
//   - object   →  any combination of years/months/weeks/days/hours/minutes/seconds
//                 (singular keys also accepted: year/month/week/day/hour/minute/second)
// Returns the normalised duration shape used everywhere else:
//   { years, months, days, seconds, inWeeks }
export function createDuration(input) {
  if (typeof input === 'number') {
    input = { seconds: input };
  } else if (typeof input === 'string') {
    // Expected format hh[:mm[:ss]]
    let seconds = 0;
    let exp = 2;
    for (const part of input.split(':', 3)) {
      seconds += parseInt(part, 10) * Math.pow(60, exp--);
    }
    input = { seconds };
  } else if (isDate(input)) {
    input = {
      hours: input.getUTCHours(),
      minutes: input.getUTCMinutes(),
      seconds: input.getUTCSeconds(),
    };
  }

  const weeks = input.weeks || input.week || 0;

  return {
    years: input.years || input.year || 0,
    months: input.months || input.month || 0,
    days: weeks * 7 + (input.days || input.day || 0),
    seconds:
      (input.hours || input.hour || 0) * 60 * 60 +
      (input.minutes || input.minute || 0) * 60 +
      (input.seconds || input.second || 0),
    inWeeks: !!weeks,
  };
}

// PLAN.md alias — `parseDuration` reads better at call sites that handle
// arbitrary user input.
export const parseDuration = createDuration;

// Total day count contributed by the duration. Years/months are excluded
// because their day count depends on the anchor date.
export function durationDays(duration) {
  return duration.days;
}

// Total seconds in the duration (days + hh:mm:ss). Years/months still
// excluded for the same reason as durationDays.
export function durationToSeconds(duration) {
  return duration.days * DAY_IN_SECONDS + duration.seconds;
}

// Re-export of date.js's addDuration under the PLAN-spec name. Useful at
// sites that already pull from duration.js and don't need date helpers.
export function addDurationToDate(date, duration, x = 1) {
  return addDuration(date, duration, x);
}
