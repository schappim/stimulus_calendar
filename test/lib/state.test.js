import { describe, it, expect, vi } from 'vitest';
import { MainState } from '../../src/lib/state.js';

describe('lib/state — MainState', () => {
  it('get / set round-trip', () => {
    const s = new MainState({ a: 1 });
    expect(s.get('a')).toBe(1);
    s.set('a', 2);
    expect(s.get('a')).toBe(2);
  });

  it('snapshot returns an independent shallow copy', () => {
    const s = new MainState({ a: 1, b: { x: 1 } });
    const snap = s.snapshot();
    expect(snap).toEqual({ a: 1, b: { x: 1 } });
    snap.a = 99;
    expect(s.get('a')).toBe(1);
  });

  it('on("change:<key>") fires with { key, value, prev }', () => {
    const s = new MainState({ a: 1 });
    const cb = vi.fn();
    s.on('change:a', cb);
    s.set('a', 2);
    expect(cb).toHaveBeenCalledWith({ key: 'a', value: 2, prev: 1 });
  });

  it('only fires when the value actually changed', () => {
    const s = new MainState({ a: 1 });
    const cb = vi.fn();
    s.on('change:a', cb);
    s.set('a', 1);
    expect(cb).not.toHaveBeenCalled();
  });

  it('onAny fires for every change', () => {
    const s = new MainState({ a: 1, b: 2 });
    const cb = vi.fn();
    s.onAny(cb);
    s.set('a', 3);
    s.set('b', 4);
    expect(cb).toHaveBeenCalledTimes(2);
  });

  it('returned thunk unsubscribes', () => {
    const s = new MainState({ a: 1 });
    const cb = vi.fn();
    const off = s.on('change:a', cb);
    off();
    s.set('a', 2);
    expect(cb).not.toHaveBeenCalled();
  });

  it('assign({...}) dispatches each change individually', () => {
    const s = new MainState({ a: 1, b: 2 });
    const calls = [];
    s.onAny((c) => calls.push(c.key));
    s.assign({ a: 10, b: 20, c: 30 });
    expect(calls).toEqual(['a', 'b', 'c']);
  });

  it('destroy clears all listeners and data', () => {
    const s = new MainState({ a: 1 });
    const cb = vi.fn();
    s.on('change:a', cb);
    s.onAny(cb);
    s.destroy();
    s.set('a', 5);
    expect(cb).not.toHaveBeenCalled();
  });
});
