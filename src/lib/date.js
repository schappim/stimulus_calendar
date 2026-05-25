// Port of calendar/packages/core/src/lib/date.js (vkurko/calendar v5.7.1).
// Pure date helpers — no DOM. `createDuration` is split out into duration.js
// per PLAN.md; addDuration accepts the same duration shape duration.js produces.

import { assign, isDate, isFunction, tzOffset } from './utils.js';

export const DAY_IN_SECONDS = 86400;

export function createDate(input = new Date(), offset = undefined) {
  return isDate(input)
    ? _fromLocalDate(input, offset)
    : _fromISOString(input, offset);
}

// Alias requested by PLAN.md for clarity at call sites that parse strings.
export const parseTimestamp = createDate;

export function cloneDate(date) {
  const result = new Date(date.getTime());
  setOffset(result, getOffset(date));
  return result;
}

export function addDuration(date, duration, x = 1) {
  date.setUTCFullYear(date.getUTCFullYear() + x * duration.years);
  let month = date.getUTCMonth() + x * duration.months;
  date.setUTCMonth(month);
  month %= 12;
  if (month < 0) month += 12;
  while (date.getUTCMonth() !== month) subtractDay(date);
  date.setUTCDate(date.getUTCDate() + x * duration.days);
  date.setUTCSeconds(date.getUTCSeconds() + x * duration.seconds);
  return date;
}

export function subtractDuration(date, duration, x = 1) {
  return addDuration(date, duration, -x);
}

export function addDay(date, x = 1) {
  date.setUTCDate(date.getUTCDate() + x);
  return date;
}

export function subtractDay(date, x = 1) {
  return addDay(date, -x);
}

export function setMidnight(date) {
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

// PLAN.md alias.
export const setStartOfDay = setMidnight;

export function toLocalDate(date) {
  return new Date(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
    date.getUTCSeconds(),
  );
}

export function toISOString(date, len = 19) {
  return date.toISOString().substring(0, len);
}

export function datesEqual(date1, ...dates2) {
  return dates2.every((date2) => date1.getTime() === date2.getTime());
}

export function nextClosestDay(date, day) {
  const diff = day - date.getUTCDay();
  date.setUTCDate(date.getUTCDate() + (diff >= 0 ? diff : diff + 7));
  return date;
}

export function prevClosestDay(date, day) {
  const diff = day - date.getUTCDay();
  date.setUTCDate(date.getUTCDate() + (diff <= 0 ? diff : diff - 7));
  return date;
}

export function noTimePart(date) {
  return typeof date === 'string' && date.length <= 10;
}

export function copyTime(toDate, fromDate) {
  toDate.setUTCHours(
    fromDate.getUTCHours(),
    fromDate.getUTCMinutes(),
    fromDate.getUTCSeconds(),
    0,
  );
  return toDate;
}

export function toSeconds(duration) {
  return duration.seconds;
}

export function nextDate(date, duration, hiddenDays) {
  addDuration(date, duration);
  _skipHiddenDays(date, hiddenDays, addDay);
  return date;
}

export function prevDate(date, duration, hiddenDays) {
  subtractDuration(date, duration);
  _skipHiddenDays(date, hiddenDays, subtractDay);
  return date;
}

// ISO week number (firstDay === 1) or Western week number (firstDay === 0).
export function getWeekNumber(date, firstDay) {
  date = cloneDate(date);
  if (firstDay === 0) {
    date.setUTCDate(date.getUTCDate() + 6 - date.getUTCDay());
  } else {
    date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  }
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date - yearStart) / 1000 / DAY_IN_SECONDS + 1) / 7);
}

export function createWeekNumberContent(week, weekNumberContent, date) {
  if (weekNumberContent) {
    return isFunction(weekNumberContent)
      ? weekNumberContent({ date: toLocalDate(date), week })
      : weekNumberContent;
  }
  return 'W' + String(week).padStart(2, '0');
}

export function parseOffset(str, match = {}) {
  const parts = str.match(/([+-])(\d{2}):(\d{2})$/);
  if (parts) {
    assign(match, parts);
    return +(parts[1] + '1') * (+parts[2] * 60 + +parts[3]);
  }
  return undefined;
}

export function applyOffsetDiff(date, offsetDiff) {
  if (offsetDiff) {
    date.setUTCMinutes(date.getUTCMinutes() + offsetDiff);
  }
  return date;
}

const offsetSymbol = Symbol('ec');

export function setOffset(date, offset) {
  date[offsetSymbol] = offset;
  return date;
}

export function getOffset(date) {
  return date[offsetSymbol];
}

// --- private ---------------------------------------------------------------

function _fromLocalDate(date, offset = undefined) {
  const result = new Date(Date.UTC(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
  ));
  applyOffsetDiff(result, offset ? offset - tzOffset(result) : 0);
  setOffset(result, offset ?? tzOffset(result));
  return result;
}

function _fromISOString(str, offset = undefined) {
  const match = {};
  const inputOffset = parseOffset(str, match);
  if (inputOffset !== undefined) str = str.substring(0, match.index);
  const parts = str.match(/\d+/g);
  const result = new Date(Date.UTC(
    +parts[0],
    +parts[1] - 1,
    +parts[2],
    +parts[3] || 0,
    +parts[4] || 0,
    +parts[5] || 0,
  ));
  if (offset !== undefined && inputOffset !== undefined) {
    applyOffsetDiff(result, offset - inputOffset);
  }
  setOffset(result, offset ?? inputOffset);
  return result;
}

function _skipHiddenDays(date, hiddenDays, dateFn) {
  if (hiddenDays.length && hiddenDays.length < 7) {
    while (hiddenDays.includes(date.getUTCDay())) {
      dateFn(date);
    }
  }
}
