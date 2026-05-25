// Phase 2 — effects pipeline. Maps state changes to derived recomputation
// and subscriber notifications, plus the small set of upstream effects
// that don't need network/Intl wiring (datesSet, viewDidMount,
// eventAllUpdated, switchView, setNowAndToday, handleTimeZoneChange,
// loadingInvoker). The loadEvents / loadResources fetch effects land
// alongside the events surface in Phase 10.

import {
  addDay, applyOffsetDiff, cloneDate, createDate, datesEqual, getOffset,
  setMidnight, setOffset, toISOString, toLocalDate,
} from './date.js';
import { toViewWithLocalDates } from './view.js';
import { isFunction } from './utils.js';

// Install a set of effects on a MainState. An effect is:
//   { deps: string[],         // option/state keys it depends on
//     run: (state) => void }  // fired on initial install + each dep change
//
// Returns an "uninstall" thunk that removes every subscription. If an
// effect returns a function from run(), that's treated as a per-tick
// teardown (called before the next run AND on uninstall).
export function installEffects(state, effects) {
  const teardowns = new Map();
  const unsubs = [];

  const invoke = (effect) => {
    const prev = teardowns.get(effect);
    if (typeof prev === 'function') prev();
    const next = effect.run(state);
    if (typeof next === 'function') teardowns.set(effect, next);
    else teardowns.delete(effect);
  };

  for (const effect of effects) {
    // Initial run.
    invoke(effect);
    // Subscribe to each declared dep.
    for (const dep of effect.deps ?? []) {
      unsubs.push(state.on(`change:${dep}`, () => invoke(effect)));
    }
  }

  return () => {
    for (const off of unsubs) off();
    for (const t of teardowns.values()) if (typeof t === 'function') t();
    teardowns.clear();
  };
}

// --- effect factories ------------------------------------------------------

// switchView — when options.view changes, reset extensions/features and
// invoke the new view's init function (returns a component factory).
// Caller supplies setViewOptions (from createOptionsStore).
export function switchViewEffect(setViewOptions) {
  return {
    deps: ['options'],
    run(state) {
      const options = state.get('options');
      const initComponent = setViewOptions(options.view);
      state.set('extensions', {});
      state.set('features', []);
      if (typeof initComponent === 'function') {
        state.set('viewComponent', initComponent(state));
      }
    },
  };
}

// runDatesSet — fire options.datesSet({ start, end, startStr, endStr,
// view }) whenever the active range changes.
export function datesSetEffect() {
  return {
    deps: ['activeRange'],
    run(state) {
      const activeRange = state.get('activeRange');
      const options = state.get('options');
      const view = state.get('view');
      if (!isFunction(options.datesSet) || !activeRange || !view) return;
      options.datesSet({
        start: toLocalDate(activeRange.start),
        end: toLocalDate(activeRange.end),
        startStr: toISOString(activeRange.start),
        endStr: toISOString(activeRange.end),
        view: toViewWithLocalDates(view),
      });
    },
  };
}

// runViewDidMount — fire options.viewDidMount({ view }) once per view
// mount. Microtask-deferred so the DOM has rendered.
export function viewDidMountEffect() {
  return {
    deps: ['view'],
    run(state) {
      const options = state.get('options');
      const view = state.get('view');
      if (!isFunction(options.viewDidMount) || !view) return;
      queueMicrotask(() => options.viewDidMount({ view: toViewWithLocalDates(view) }));
    },
  };
}

// runEventAllUpdated — fire options.eventAllUpdated({ view }) after
// every events change, batched with setTimeout so a flurry of updates
// fires once.
export function eventAllUpdatedEffect() {
  let timer = null;
  return {
    deps: ['filteredEvents'],
    run(state) {
      const options = state.get('options');
      const view = state.get('view');
      if (!isFunction(options.eventAllUpdated) || !view) return;
      if (timer) return;
      timer = setTimeout(() => {
        timer = null;
        options.eventAllUpdated({ view: toViewWithLocalDates(view) });
      }, 0);
    },
  };
}

// setNowAndToday — tick a `now` Date and a `today` Date on the state once
// a second. Returns a teardown that clears the interval. Re-runs whenever
// the offset changes so timezone switches re-anchor immediately.
export function nowAndTodayEffect() {
  return {
    deps: ['offset'],
    run(state) {
      const offset = state.get('offset');
      const update = () => {
        const now = createDate(undefined, offset);
        const today = setMidnight(cloneDate(now));
        state.set('now', now);
        const prevToday = state.get('today');
        if (!prevToday || !datesEqual(prevToday, today)) state.set('today', today);
      };
      update();
      const interval = setInterval(update, 1000);
      return () => clearInterval(interval);
    },
  };
}

// handleTimeZoneChange — when offset changes, shift each event's
// start/end by the offset diff (and re-brand) and shift options.date.
// Mirrors the upstream behaviour for floating dates (no original offset →
// branded only, not shifted).
export function timeZoneChangeEffect(setOption) {
  return {
    deps: ['offset'],
    run(state) {
      const offset = state.get('offset');
      const events = state.get('events') ?? [];
      const options = state.get('options');

      for (const event of events) {
        if (event.allDay) continue;
        for (const prop of ['start', 'end']) {
          const dateOffset = getOffset(event[prop]);
          if (dateOffset !== undefined) applyOffsetDiff(event[prop], offset - dateOffset);
          setOffset(event[prop], offset);
        }
      }

      const dateOffset = getOffset(options.date);
      if (dateOffset !== undefined) {
        const diff = createDate(undefined, offset).getUTCDay() -
                     createDate(undefined, dateOffset).getUTCDay();
        const date = addDay(cloneDate(options.date), diff);
        setOption('date', date);
      }
      setOffset(options.date, offset);
    },
  };
}

// loadingInvoker — counting wrapper around options.loading. Effect-bound
// users can call returned .start()/.stop() pairs to bracket async work;
// loading(true) fires on the first start, loading(false) on the last
// stop.
export function createLoadingInvoker(state) {
  let counter = 0;
  function invoke(value) {
    const options = state.get('options');
    if (isFunction(options.loading)) options.loading(value);
  }
  return {
    start: () => ++counter === 1 && invoke(true),
    stop:  () => --counter === 0 && invoke(false),
  };
}
