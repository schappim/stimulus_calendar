import { describe, it, expect, vi } from 'vitest';
import { createOptionsStore, diff } from '../../src/lib/options_store.js';

const plugin = (def) => ({
  createOptions(options) {
    Object.assign(options, def);
  },
});

describe('lib/options_store', () => {
  it('seeds base defaults + plugin contributions', () => {
    const { options } = createOptionsStore([plugin({ view: 'dayGridMonth' })]);
    expect(options.theme.calendar).toBe('ec');
    expect(options.firstDay).toBe(0);
    expect(options.view).toBe('dayGridMonth');
    // Default parser normalises duration through createDuration.
    expect(options.duration).toEqual({
      years: 0, months: 0, days: 7, seconds: 0, inWeeks: true,
    });
  });

  it('userOptions.view overrides default', () => {
    const { options } = createOptionsStore(
      [plugin({ view: 'dayGridMonth' })],
      { view: 'timeGridWeek' },
    );
    expect(options.view).toBe('timeGridWeek');
  });

  it('per-view overrides apply when view activates', () => {
    const dayGridPlugin = {
      createOptions(o) {
        Object.assign(o, { view: 'dayGridMonth' });
        o.views.dayGridMonth = { duration: { months: 1 } };
        o.views.timeGridWeek = { duration: { weeks: 1 } };
      },
    };
    const { options, setViewOptions } = createOptionsStore([dayGridPlugin]);
    expect(options.duration).toEqual({
      years: 0, months: 1, days: 0, seconds: 0, inWeeks: false,
    });

    setViewOptions('timeGridWeek');
    expect(options.duration).toEqual({
      years: 0, months: 0, days: 7, seconds: 0, inWeeks: true,
    });
  });

  it('setOption updates live options + triggers parser when parsed:false', () => {
    const parserPlugin = {
      createOptions(o) {
        Object.assign(o, { view: 'dayGridMonth' });
        o.views.dayGridMonth = {};
      },
      createParsers(p) {
        p.hiddenDays = (input) => input.map(Number);
      },
    };
    const { options, setOption } = createOptionsStore([parserPlugin]);
    setOption('hiddenDays', ['0', '6'], false);
    expect(options.hiddenDays).toEqual([0, 6]);
  });

  it('setOption with parsed:true skips the parser', () => {
    const parserPlugin = {
      createOptions(o) {
        Object.assign(o, { view: 'dayGridMonth' });
        o.views.dayGridMonth = {};
      },
      createParsers(p) { p.firstDay = (i) => Number(i) * 100; },
    };
    const { options, setOption } = createOptionsStore([parserPlugin]);
    setOption('firstDay', 5);  // parsed:true (default) → no Number*100
    expect(options.firstDay).toBe(5);
  });

  it('setOption ignores unknown keys', () => {
    const { options, setOption } = createOptionsStore([plugin({ view: 'dayGridMonth' })]);
    setOption('madeUp', 'value');
    expect(options.madeUp).toBeUndefined();
  });

  it('function-mergeable options receive the previous value', () => {
    const mergePlugin = {
      createOptions(o) {
        Object.assign(o, { view: 'dayGridMonth' });
        o.views.dayGridMonth = {};
      },
    };
    const { options, setOption } = createOptionsStore(
      [mergePlugin],
      { theme: (prev) => ({ ...prev, custom: 'ec-custom' }) },
    );
    expect(options.theme.calendar).toBe('ec');
    expect(options.theme.custom).toBe('ec-custom');
  });

  it('diff returns [key, value] for each changed key', () => {
    const a = { x: 1, y: 2, z: 3 };
    const b = { x: 1, y: 9, z: 3 };
    expect(diff(b, a)).toEqual([['y', 9]]);
  });
});
