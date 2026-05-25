import { describe, it, expect, vi } from 'vitest';
import {
  undefinedOr,
  btnTextDay, btnTextWeek, btnTextMonth, btnTextYear,
  themeView,
} from '../../src/lib/options.js';

describe('lib/options', () => {
  it('undefinedOr short-circuits on undefined input', () => {
    const inner = vi.fn((x) => x + 1);
    const safe = undefinedOr(inner);
    expect(safe(undefined)).toBeUndefined();
    expect(inner).not.toHaveBeenCalled();

    expect(safe(2)).toBe(3);
    expect(inner).toHaveBeenCalledOnce();
  });

  it('btnText* factories add next/prev labels for the matching period', () => {
    expect(btnTextDay({ today: 'today' })).toEqual({
      today: 'today', next: 'Next day', prev: 'Previous day',
    });
    expect(btnTextWeek({ today: 'today' }).next).toBe('Next week');
    expect(btnTextMonth({}).prev).toBe('Previous month');
    expect(btnTextYear({}).next).toBe('Next year');
  });

  it('themeView returns a merge function that adds a view class string', () => {
    const apply = themeView('ec-day-grid ec-month-view');
    expect(apply({ calendar: 'ec', body: 'ec-body' })).toEqual({
      calendar: 'ec',
      body: 'ec-body',
      view: 'ec-day-grid ec-month-view',
    });
  });
});
