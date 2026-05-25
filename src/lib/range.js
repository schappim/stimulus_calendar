// Port of calendar/packages/core/src/lib/range.js (vkurko/calendar v5.7.1),
// extended with the dateInRange / rangesOverlap / intersectRanges helpers
// listed in PLAN.md.

import { createDate, setMidnight, cloneDate, addDay } from './date.js';

// Normalise an input { start, end } pair (strings or Dates) into Date
// instances at midnight. Either bound may be missing.
export function createDateRange(input) {
  let start;
  let end;
  if (input) {
    ({ start, end } = input);
    if (start) start = setMidnight(createDate(start));
    if (end) end = setMidnight(createDate(end));
  }
  return { start, end };
}

// Returns true when the date falls outside the (closed-start, closed-end)
// range. Missing bounds count as unbounded.
export function outsideRange(date, range) {
  return (range.start && date < range.start) || (range.end && date > range.end);
}

// Inverse of outsideRange.
export function dateInRange(date, range) {
  return !outsideRange(date, range);
}

// Enumerate every day from range.start (inclusive) up to range.end
// (exclusive). Useful for filling DayGrid rows. Returns cloned Date
// instances so the caller can mutate freely. Throws if either bound is
// missing — see datesInRange call sites in view-derived helpers.
export function datesInRange(range) {
  if (!range.start || !range.end) {
    throw new Error('datesInRange requires both start and end');
  }
  const dates = [];
  const cursor = cloneDate(range.start);
  while (cursor < range.end) {
    dates.push(cloneDate(cursor));
    addDay(cursor);
  }
  return dates;
}

// Half-open overlap test (a.end > b.start && b.end > a.start). Either bound
// may be missing on either range; a missing start is `-Infinity`, a missing
// end is `+Infinity`.
export function rangesOverlap(a, b) {
  const aStart = a.start ? a.start.getTime() : -Infinity;
  const aEnd   = a.end   ? a.end.getTime()   : Infinity;
  const bStart = b.start ? b.start.getTime() : -Infinity;
  const bEnd   = b.end   ? b.end.getTime()   : Infinity;
  return aEnd > bStart && bEnd > aStart;
}

// Intersect two ranges. Returns the narrowest { start, end } that fits in
// both, or null if they don't overlap. Open bounds inherit from the other
// range when one side is missing.
export function intersectRanges(a, b) {
  if (!rangesOverlap(a, b)) return null;

  const pickLater   = (x, y) => (!x ? y : !y ? x : x > y ? x : y);
  const pickEarlier = (x, y) => (!x ? y : !y ? x : x < y ? x : y);

  return {
    start: pickLater(a.start, b.start),
    end: pickEarlier(a.end, b.end),
  };
}
