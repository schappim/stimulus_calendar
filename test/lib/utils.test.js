import { describe, it, expect } from 'vitest';
import {
  assign, keys, entries, hasOwn,
  floor, ceil, min, max,
  symbol, length, empty,
  tzOffset,
  isArray, isFunction, isPlainObject, isDate,
  run, runAll, noop, identity,
} from '../../src/lib/utils.js';

describe('lib/utils', () => {
  it('assign / keys / entries / hasOwn passthroughs', () => {
    expect(assign({}, { a: 1 }, { b: 2 })).toEqual({ a: 1, b: 2 });
    expect(keys({ a: 1, b: 2 }).sort()).toEqual(['a', 'b']);
    expect(entries({ a: 1 })).toEqual([['a', 1]]);
    expect(hasOwn({ a: 1 }, 'a')).toBe(true);
    expect(hasOwn({ a: 1 }, 'b')).toBe(false);
  });

  it('floor / ceil / min / max math', () => {
    expect(floor(1.9)).toBe(1);
    expect(ceil(1.1)).toBe(2);
    expect(min(3, 1, 2)).toBe(1);
    expect(max(3, 1, 2)).toBe(3);
  });

  it('symbol returns a unique ec-tagged Symbol', () => {
    const a = symbol();
    const b = symbol();
    expect(typeof a).toBe('symbol');
    expect(a).not.toBe(b);
    expect(a.description).toBe('ec');
  });

  it('length / empty', () => {
    expect(length([1, 2, 3])).toBe(3);
    expect(empty([])).toBe(true);
    expect(empty([1])).toBe(false);
  });

  it('tzOffset is the inverse of Date#getTimezoneOffset', () => {
    const d = new Date('2026-05-25T00:00:00Z');
    expect(tzOffset(d)).toBe(-d.getTimezoneOffset());
  });

  it('type guards', () => {
    expect(isArray([])).toBe(true);
    expect(isArray('x')).toBe(false);

    expect(isFunction(() => 0)).toBe(true);
    expect(isFunction({})).toBe(false);

    expect(isPlainObject({ a: 1 })).toBe(true);
    expect(isPlainObject(Object.create(null))).toBe(true);
    expect(isPlainObject([])).toBe(false);
    expect(isPlainObject(null)).toBe(false);
    expect(isPlainObject(new Date())).toBe(false);

    expect(isDate(new Date())).toBe(true);
    expect(isDate('2026-05-25')).toBe(false);
  });

  it('run / runAll / noop / identity', () => {
    let calls = 0;
    expect(run(() => 42)).toBe(42);
    runAll([() => calls++, () => calls++]);
    expect(calls).toBe(2);
    expect(noop()).toBeUndefined();
    expect(identity('x')).toBe('x');
  });
});
