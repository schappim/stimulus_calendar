import { describe, it, expect } from 'vitest';
import { createView, toViewWithLocalDates } from '../../src/lib/view.js';
import { createDate } from '../../src/lib/date.js';

const d = (iso) => createDate(iso);

describe('lib/view', () => {
  it('createView builds the public View shape', () => {
    const currentRange = { start: d('2026-05-01'), end: d('2026-06-01') };
    const activeRange  = { start: d('2026-04-26'), end: d('2026-06-07') };
    const v = createView('dayGridMonth', 'May 2026', currentRange, activeRange);
    expect(v).toEqual({
      type: 'dayGridMonth',
      title: 'May 2026',
      currentStart: currentRange.start,
      currentEnd:   currentRange.end,
      activeStart:  activeRange.start,
      activeEnd:    activeRange.end,
      calendar: undefined,
    });
  });

  it('toViewWithLocalDates converts every Date field, leaves type/title alone', () => {
    const v = createView('dayGridMonth', 'May 2026',
      { start: d('2026-05-01'), end: d('2026-06-01') },
      { start: d('2026-04-26'), end: d('2026-06-07') });
    const local = toViewWithLocalDates(v);
    expect(local).not.toBe(v);
    expect(local.type).toBe('dayGridMonth');
    expect(local.title).toBe('May 2026');
    expect(local.currentStart instanceof Date).toBe(true);
    expect(local.currentStart.getFullYear()).toBe(2026);
  });
});
