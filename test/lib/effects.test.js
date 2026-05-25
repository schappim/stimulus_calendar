import { describe, it, expect, vi } from 'vitest';
import { MainState } from '../../src/lib/state.js';
import {
  installEffects,
  switchViewEffect, datesSetEffect, viewDidMountEffect,
  eventAllUpdatedEffect, nowAndTodayEffect, timeZoneChangeEffect,
  createLoadingInvoker,
} from '../../src/lib/effects.js';
import { createDate } from '../../src/lib/date.js';

const d = (iso) => createDate(iso);

describe('lib/effects', () => {
  it('installEffects runs each effect once on install and on dep change', () => {
    const state = new MainState({ options: {} });
    const run = vi.fn();
    const uninstall = installEffects(state, [{ deps: ['options'], run }]);
    expect(run).toHaveBeenCalledTimes(1);
    state.set('options', { a: 1 });
    expect(run).toHaveBeenCalledTimes(2);
    uninstall();
    state.set('options', { a: 2 });
    expect(run).toHaveBeenCalledTimes(2);
  });

  it('installEffects calls a returned teardown before the next run', () => {
    const teardown = vi.fn();
    const state = new MainState({ x: 0 });
    installEffects(state, [{
      deps: ['x'],
      run() { return teardown; },
    }]);
    expect(teardown).not.toHaveBeenCalled();
    state.set('x', 1);
    expect(teardown).toHaveBeenCalledOnce();
  });

  it('switchViewEffect re-applies view options + resets ext/features', () => {
    const state = new MainState({
      options: { view: 'dayGridMonth' },
      extensions: { keep: 'me' },
      features: ['x'],
    });
    const setViewOptions = vi.fn(() => () => 'componentInstance');
    installEffects(state, [switchViewEffect(setViewOptions)]);
    expect(setViewOptions).toHaveBeenCalledWith('dayGridMonth');
    expect(state.get('extensions')).toEqual({});
    expect(state.get('features')).toEqual([]);
    expect(state.get('viewComponent')).toBe('componentInstance');
  });

  it('datesSetEffect calls options.datesSet with local-date payload', () => {
    const datesSet = vi.fn();
    const state = new MainState({
      activeRange: { start: d('2026-05-25'), end: d('2026-06-01') },
      view: {
        type: 'dayGridMonth', title: 'May',
        currentStart: d('2026-05-25'), currentEnd: d('2026-06-01'),
        activeStart: d('2026-05-25'),  activeEnd: d('2026-06-01'),
      },
      options: { datesSet },
    });
    installEffects(state, [datesSetEffect()]);
    expect(datesSet).toHaveBeenCalledOnce();
    const call = datesSet.mock.calls[0][0];
    expect(call.startStr).toContain('2026-05-25');
    expect(call.endStr).toContain('2026-06-01');
    expect(call.view.type).toBe('dayGridMonth');
  });

  it('viewDidMountEffect fires options.viewDidMount in a microtask', async () => {
    const viewDidMount = vi.fn();
    const state = new MainState({
      view: {
        type: 'dayGridMonth', title: 'May',
        currentStart: d('2026-05-25'), currentEnd: d('2026-06-01'),
        activeStart: d('2026-05-25'),  activeEnd: d('2026-06-01'),
      },
      options: { viewDidMount },
    });
    installEffects(state, [viewDidMountEffect()]);
    expect(viewDidMount).not.toHaveBeenCalled();
    await Promise.resolve();
    expect(viewDidMount).toHaveBeenCalledOnce();
  });

  it('eventAllUpdatedEffect batches into a single setTimeout', async () => {
    const eventAllUpdated = vi.fn();
    const state = new MainState({
      filteredEvents: [],
      view: { type: 'dayGridMonth', title: '', currentStart: d('2026-05-25'),
        currentEnd: d('2026-06-01'), activeStart: d('2026-05-25'), activeEnd: d('2026-06-01') },
      options: { eventAllUpdated },
    });
    installEffects(state, [eventAllUpdatedEffect()]);
    state.set('filteredEvents', [1]);
    state.set('filteredEvents', [1, 2]);
    state.set('filteredEvents', [1, 2, 3]);
    // Fires once (queued at 0ms).
    await new Promise((r) => setTimeout(r, 5));
    expect(eventAllUpdated).toHaveBeenCalledOnce();
  });

  it('nowAndTodayEffect installs now+today and returns a teardown', () => {
    vi.useFakeTimers();
    const state = new MainState({ offset: 0 });
    const uninstall = installEffects(state, [nowAndTodayEffect()]);
    expect(state.get('now') instanceof Date).toBe(true);
    expect(state.get('today') instanceof Date).toBe(true);
    uninstall();
    vi.useRealTimers();
  });

  it('timeZoneChangeEffect shifts events with stored offsets', () => {
    const setOption = vi.fn();
    const startWithOffset = d('2026-05-25T09:00:00+10:00');  // offset stored
    const endWithOffset   = d('2026-05-25T10:00:00+10:00');
    const events = [{
      allDay: false,
      start: startWithOffset, end: endWithOffset,
    }];
    const state = new MainState({
      offset: 0,                       // shift to UTC (was +600)
      events,
      options: { date: d('2026-05-25T00:00:00+10:00') },
    });
    installEffects(state, [timeZoneChangeEffect(setOption)]);
    // Event start should have been shifted back by 10 hours.
    expect(events[0].start.getUTCHours()).toBe(23);  // 09:00 +10 → 23:00 UTC prev day
    expect(setOption).toHaveBeenCalled();
  });

  it('createLoadingInvoker invokes loading(true)/(false) at first start / last stop', () => {
    const loading = vi.fn();
    const state = new MainState({ options: { loading } });
    const invoker = createLoadingInvoker(state);
    invoker.start();
    invoker.start();
    expect(loading).toHaveBeenCalledTimes(1);
    expect(loading).toHaveBeenLastCalledWith(true);
    invoker.stop();
    invoker.stop();
    expect(loading).toHaveBeenCalledTimes(2);
    expect(loading).toHaveBeenLastCalledWith(false);
  });
});
