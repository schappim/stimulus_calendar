// Port of calendar/packages/core/src/lib/derived.js + storage/derived.js
// (vkurko/calendar v5.7.1). The upstream uses Svelte 5 `untrack` + a
// `mainState` proxy; we strip the reactivity and expose pure functions
// that take their inputs explicitly. The state module will call these on
// every relevant change.

import {
  addDay, addDuration, cloneDate, prevClosestDay, setMidnight, subtractDay,
  parseOffset,
} from './date.js';
import { createView, toViewWithLocalDates } from './view.js';
import { toEventWithLocalDates } from './events.js';
import { isFunction, tzOffset } from './utils.js';

// Effective Intl format helpers around an Intl.DateTimeFormat (or a
// user-supplied function). Each returns an object exposing the format
// methods the rest of the code expects.

// intl(locale, format) → { format(date) }
//   `format` can be an Intl-options object, or a function that takes a Date.
// Defaults to formatting in UTC since internal Date values are constructed
// via Date.UTC(...) and represent the user's intended (offset-aware) wall
// clock — formatting in the JS runtime's local TZ would shift the labels by
// the offset.
export function intl(locale, format) {
  const intlObj = isFunction(format)
    ? { format }
    : new Intl.DateTimeFormat(locale, { timeZone: 'UTC', ...format });
  return {
    format: (date) => intlObj.format(date instanceof Date ? date : new Date(date)),
  };
}

// intlRange(locale, format) → { formatRange(start, end) }
// Handles iOS < 16 ordering bug by swapping parts when start > end.
// @see https://github.com/vkurko/calendar/issues/227
export function intlRange(locale, format) {
  let formatRange;
  if (isFunction(format)) {
    formatRange = format;
  } else {
    const intlObj = new Intl.DateTimeFormat(locale, { timeZone: 'UTC', ...format });
    formatRange = (start, end) => {
      if (start <= end) return intlObj.formatRange(start, end);
      const parts = intlObj.formatRangeToParts(end, start);
      let result = '';
      const sources = ['startRange', 'endRange'];
      const processed = [false, false];
      for (const part of parts) {
        const i = sources.indexOf(part.source);
        if (i >= 0) {
          if (!processed[i]) {
            result += _getParts(sources[1 - i], parts);
            processed[i] = true;
          }
        } else {
          result += part.value;
        }
      }
      return result;
    };
  }
  return { formatRange };
}

function _getParts(source, parts) {
  let result = '';
  for (const part of parts) if (part.source === source) result += part.value;
  return result;
}

// Range / view computations. Each takes the parts of `mainState` it needs
// and returns the derived value.

// currentRange: from a date anchor + duration + firstDay, work out
// what range the user explicitly asked for (whole year → year start,
// month → 1st, week → previous firstDay).
export function currentRange(date, duration, firstDay) {
  const start = cloneDate(date);
  if (duration.years) {
    start.setUTCMonth(0);
    start.setUTCDate(1);
  } else if (duration.months) {
    start.setUTCDate(1);
  } else if (duration.inWeeks) {
    prevClosestDay(start, firstDay);
  }
  const end = addDuration(cloneDate(start), duration);
  return { start, end };
}

// activeRange: pad the currentRange to whatever the view actually draws.
// `extension` is an optional `(start, end) => { start, end }` (used by
// dayGridMonth to expand to the full visible weeks grid).
export function activeRange(curRange, extension) {
  const start = cloneDate(curRange.start);
  const end = cloneDate(curRange.end);
  return extension ? extension(start, end) : { start, end };
}

// viewDates: enumerate every day within activeRange that isn't hidden.
// Returns a non-empty array — when the entire range is hidden, callers
// should re-set `date` so navigation lands on a visible day.
export function viewDates(activeRng, hiddenDays) {
  const dates = [];
  const date = setMidnight(cloneDate(activeRng.start));
  const end = setMidnight(cloneDate(activeRng.end));
  while (date < end) {
    if (!hiddenDays.includes(date.getUTCDay())) {
      dates.push(cloneDate(date));
    }
    addDay(date);
  }
  return dates;
}

// viewTitle: format the inclusive range start..end-1 using an intlRange-shaped
// helper (see intlRange above).
export function viewTitle(intlTitle, curRange) {
  return intlTitle.formatRange(curRange.start, subtractDay(cloneDate(curRange.end)));
}

// filteredEvents: apply eventFilter / filterEventsWithResources, then sort
// either by user-supplied eventOrder or (default) by start ascending with
// all-day events floated to the top of equal-start slots.
export function filteredEvents(events, view, opts) {
  const { eventFilter, eventOrder, filterEventsWithResources, resources } = opts;

  let result = [...events];

  if (isFunction(eventFilter)) {
    const localEvents = events.map(toEventWithLocalDates);
    const localView = toViewWithLocalDates(view);
    result = result.filter((event, index) => eventFilter({
      event: toEventWithLocalDates(event),
      index,
      events: localEvents,
      view: localView,
    }));
  }

  if (filterEventsWithResources) {
    result = result.filter((event) =>
      resources.some((resource) => event.resourceIds.includes(resource.id)));
  }

  if (isFunction(eventOrder)) {
    result.sort((a, b) => eventOrder(toEventWithLocalDates(a), toEventWithLocalDates(b)));
  } else {
    result.sort((a, b) => (a.start - b.start) || (b.allDay - a.allDay));
  }

  return result;
}

// offset: resolve timeZone → minutes-east-of-UTC. 'local' uses the runtime
// tzOffset(), 'UTC' is 0, anything else is parseOffset()-able (e.g.
// '+10:00') with a fallback to local for IANA-only names that
// parseOffset can't handle yet.
export function offset(timeZone) {
  if (timeZone === 'local') return tzOffset();
  if (timeZone === 'UTC') return 0;
  return parseOffset(timeZone) ?? tzOffset();
}

// view: re-export createView under the derived-helper name for symmetry
// with the upstream storage/derived.js shape.
export function view(viewName, viewTitleStr, curRange, activeRng) {
  return createView(viewName, viewTitleStr, curRange, activeRng);
}
