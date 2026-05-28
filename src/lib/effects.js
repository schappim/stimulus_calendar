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

// Fire an effect: call options.<name>(detail) AND dispatch a matching
// DOM CustomEvent. The controller wires state.fire to a helper that
// does BOTH; fall back to a manual options.<name>() call when state.fire
// isn't configured (e.g. unit tests that drive effects without a
// controller).
function fire(state, name, detail) {
  const dispatch = state.get('fire');
  if (typeof dispatch === 'function') {
    dispatch(name, detail);
    return;
  }
  const cb = state.get('options')?.[name];
  if (typeof cb === 'function') cb(detail);
}

// runDatesSet — fire options.datesSet({ start, end, startStr, endStr,
// view }) AND dispatch calendar:datesSet whenever the active range
// changes.
export function datesSetEffect() {
  return {
    deps: ['activeRange'],
    run(state) {
      const activeRange = state.get('activeRange');
      const view = state.get('view');
      if (!activeRange || !view) return;
      fire(state, 'datesSet', {
        start: toLocalDate(activeRange.start),
        end: toLocalDate(activeRange.end),
        startStr: toISOString(activeRange.start),
        endStr: toISOString(activeRange.end),
        view: toViewWithLocalDates(view),
      });
    },
  };
}

// runViewDidMount — fire options.viewDidMount({ view }) + dispatch
// calendar:viewDidMount once per view mount. Microtask-deferred so the
// DOM has rendered.
export function viewDidMountEffect() {
  return {
    deps: ['view'],
    run(state) {
      const view = state.get('view');
      if (!view) return;
      queueMicrotask(() => fire(state, 'viewDidMount', { view: toViewWithLocalDates(view) }));
    },
  };
}

// loadEvents — invoke `refetch()` whenever the rendered range actually
// shifts. Solves the URL-event-source bootstrap (the controller exposes
// `refetchEvents()` but nothing previously auto-called it on initial
// mount or navigation) AND prevents the post-fetch loop:
//
//   refetchEvents → setState('events') → recompute → state.set('activeRange', NEW_AR)
//   ───────────────── activeRange changes by REFERENCE every recompute,
//                     because derived.js#activeRange returns a fresh
//                     `{ start, end }` ─ so `deps: ['activeRange']`
//                     fires on every recompute, not just when the user
//                     navigated to a different range.
//
// The fix here: dedupe by the time-value content of activeRange, not by
// reference. A post-fetch recompute that lands on the same window is a
// no-op; only a genuine prev/next/view-switch/gotoDate triggers a new
// fetch. Direct `calendarApi.refetchEvents()` calls bypass this effect
// (they call _refetchEvents directly) so explicit refetches always run.
export function loadEventsEffect(refetch, getLoadedRange) {
  let lastKey = null;
  return {
    deps: ['activeRange'],
    run(state) {
      const ar = state.get('activeRange');
      if (!ar?.start || !ar?.end) return;
      const key = `${ar.start.getTime()}|${ar.end.getTime()}`;
      if (key === lastKey) return;
      lastKey = key;
      // Only fetch when there's something to fetch from — pure inline
      // `options.events: [...]` arrays don't need a refetch round-trip.
      const options = state.get('options');
      const hasUrlSource = Array.isArray(options.eventSources) && options.eventSources.length > 0;
      const hasFnEvents = typeof options.events === 'function';
      if (!hasUrlSource && !hasFnEvents) return;
      // Coverage cache. _refetchEvents pulls a BUFFERED window (wider than
      // the bare active range — see _eventFetchRange) and records it via
      // getLoadedRange(). When the user only switches VIEW (month → week →
      // day → agenda → staff) or pages within that window, the new active
      // range already sits inside the loaded window — skip the network
      // round-trip and re-render from the events we already hold. Only a
      // navigation that lands OUTSIDE the window (a distant month, a
      // prev/next past the buffer) fetches again. Explicit
      // calendarApi.refetchEvents() bypasses this effect entirely (it calls
      // _refetchEvents directly), so a forced refresh always runs.
      const loaded = getLoadedRange?.();
      if (loaded &&
          ar.start.getTime() >= loaded.start &&
          ar.end.getTime() <= loaded.end) {
        return;
      }
      // Fire-and-forget; refetch returns a Promise but the effect runner
      // doesn't await it.
      refetch();
    },
  };
}

// runEventAllUpdated — fire options.eventAllUpdated + dispatch
// calendar:eventAllUpdated after every events change, batched with
// setTimeout so a flurry of updates fires once.
export function eventAllUpdatedEffect() {
  let timer = null;
  return {
    deps: ['filteredEvents'],
    run(state) {
      const view = state.get('view');
      if (!view) return;
      if (timer) return;
      timer = setTimeout(() => {
        timer = null;
        fire(state, 'eventAllUpdated', { view: toViewWithLocalDates(view) });
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
//
// Fall back to options.events when state.events hasn't been populated
// yet — events provided via the initial bundle live on options.events
// until the first addEvent/refetch. Without the fallback a live
// setOption('timeZone', ...) would leave those events unshifted.
export function timeZoneChangeEffect(setOption) {
  return {
    deps: ['offset'],
    run(state) {
      const offset = state.get('offset');
      const options = state.get('options');
      const events = state.get('events') ?? options?.events ?? [];

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
