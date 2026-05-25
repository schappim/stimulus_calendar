// Port of calendar/packages/core/src/lib/utils.js (vkurko/calendar v5.7.1).
// Pure helpers — no DOM access. Browser-only helpers (isRtl) live in dom.js,
// option helpers (undefinedOr) live in options.js.

export function assign(...args) {
  return Object.assign(...args);
}

export function keys(object) {
  return Object.keys(object);
}

export function entries(object) {
  return Object.entries(object);
}

export function hasOwn(object, property) {
  return Object.hasOwn(object, property);
}

export function floor(value) {
  return Math.floor(value);
}

export function ceil(value) {
  return Math.ceil(value);
}

export function min(...args) {
  return Math.min(...args);
}

export function max(...args) {
  return Math.max(...args);
}

export function symbol() {
  return Symbol('ec');
}

export function length(array) {
  return array.length;
}

export function empty(array) {
  return !length(array);
}

// Local timezone offset in minutes, east-of-UTC positive (the sign convention
// vkurko/calendar uses internally — the inverse of Date#getTimezoneOffset).
export function tzOffset(date = new Date()) {
  return -date.getTimezoneOffset();
}

export function isArray(value) {
  return Array.isArray(value);
}

export function isFunction(value) {
  return typeof value === 'function';
}

export function isPlainObject(value) {
  if (typeof value !== 'object' || value === null) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === null || prototype === Object.prototype;
}

export function isDate(value) {
  return value instanceof Date;
}

export function run(fn) {
  return fn();
}

export function runAll(fns) {
  fns.forEach(run);
}

export function noop() {}

export const identity = (x) => x;
