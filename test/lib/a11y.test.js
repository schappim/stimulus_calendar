import { describe, it, expect, vi } from 'vitest';
import { keyEnter } from '../../src/lib/a11y.js';

describe('lib/a11y', () => {
  it('fires on Enter', () => {
    const fn = vi.fn(() => 'hit');
    const handler = keyEnter(fn);
    expect(handler({ key: 'Enter' })).toBe('hit');
    expect(fn).toHaveBeenCalledOnce();
  });

  it('fires on Space and prevents default scroll', () => {
    const fn = vi.fn(() => 'hit');
    const evt = { key: ' ', preventDefault: vi.fn() };
    const handler = keyEnter(fn);
    expect(handler(evt)).toBe('hit');
    expect(evt.preventDefault).toHaveBeenCalledOnce();
  });

  it('ignores other keys', () => {
    const fn = vi.fn();
    expect(keyEnter(fn)({ key: 'a' })).toBeUndefined();
    expect(fn).not.toHaveBeenCalled();
  });

  it('binds `_this` correctly', () => {
    const ctx = { label: 'ok' };
    const handler = keyEnter(function () { return this.label; }, ctx);
    expect(handler({ key: 'Enter' })).toBe('ok');
  });
});
