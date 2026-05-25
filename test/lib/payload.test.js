import { describe, it, expect } from 'vitest';
import { setPayload, hasPayload, getPayload } from '../../src/lib/payload.js';

describe('lib/payload', () => {
  it('hasPayload is false until set', () => {
    const obj = {};
    expect(hasPayload(obj)).toBe(false);
  });

  it('setPayload / getPayload round-trip', () => {
    const obj = { id: 1 };
    setPayload(obj, { hidden: true });
    expect(hasPayload(obj)).toBe(true);
    expect(getPayload(obj)).toEqual({ hidden: true });
  });

  it('payload key is invisible to public iteration', () => {
    const obj = { id: 1 };
    setPayload(obj, { internal: 'state' });
    expect(Object.keys(obj)).toEqual(['id']);
    expect(JSON.stringify(obj)).toBe('{"id":1}');
  });

  it('hasPayload tolerates undefined / null', () => {
    expect(hasPayload(undefined)).toBe(false);
    expect(hasPayload(null)).toBe(false);
  });
});
