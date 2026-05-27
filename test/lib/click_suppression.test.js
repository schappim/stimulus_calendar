import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MainState } from '../../src/lib/state.js';
import {
  armChipClickSuppression,
  consumeChipClickSuppression,
} from '../../src/lib/click_suppression.js';

describe('click_suppression', () => {
  let state;
  beforeEach(() => {
    state = new MainState();
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns false when nothing has armed the flag', () => {
    expect(consumeChipClickSuppression(state)).toBe(false);
  });

  it('returns true once after arming, then false on subsequent calls', () => {
    armChipClickSuppression(state);
    expect(consumeChipClickSuppression(state)).toBe(true);
    // Consume clears — a second call sees false even though the timer
    // hasn't fired yet.
    expect(consumeChipClickSuppression(state)).toBe(false);
  });

  it('clears the flag after the safety timeout', () => {
    armChipClickSuppression(state, 400);
    expect(state.get('_suppressNextChipClick')).toBe(true);
    vi.advanceTimersByTime(401);
    expect(state.get('_suppressNextChipClick')).toBe(false);
  });

  it('re-arming resets the timeout', () => {
    armChipClickSuppression(state, 400);
    vi.advanceTimersByTime(300);
    armChipClickSuppression(state, 400);
    // 300 ms in, re-armed: original timeout cancelled, new one
    // started. 200 ms later (500 ms total wall-clock) the flag is
    // still set because the second timer hasn't elapsed.
    vi.advanceTimersByTime(200);
    expect(state.get('_suppressNextChipClick')).toBe(true);
    vi.advanceTimersByTime(201);
    expect(state.get('_suppressNextChipClick')).toBe(false);
  });

  it('survives null/undefined state without throwing', () => {
    expect(() => armChipClickSuppression(null)).not.toThrow();
    expect(() => armChipClickSuppression(undefined)).not.toThrow();
    expect(consumeChipClickSuppression(null)).toBe(false);
    expect(consumeChipClickSuppression(undefined)).toBe(false);
  });
});
