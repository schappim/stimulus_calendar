// Port of calendar/packages/core/src/lib/events.js (vkurko/calendar v5.7.1).
//
// Phase 1 scope: createEvents (parse/normalise input → internal shape),
// createEventSources, event-display predicates, eventIntersects, cloning
// helpers, runReposition. createEventContent + createEventClasses
// depend on view.js and the Intl helpers and land alongside view.js.

import {
  addDay, cloneDate, copyTime, createDate, datesEqual, noTimePart,
  setMidnight, toISOString, toLocalDate,
} from './date.js';
import { createElement } from './dom.js';
import { assign, isArray, isFunction } from './utils.js';

let eventId = 1;

// Parse raw user-supplied events into the normalised internal shape used
// everywhere else. `offset` is forwarded to createDate so the caller (the
// options pipeline) controls timezone interpretation.
export function createEvents(input, offset = undefined) {
  return input.map((event) => {
    const result = {
      id: 'id' in event ? String(event.id) : `{generated-${eventId++}}`,
      resourceIds: toArrayProp(event, 'resourceId').map(String),
      allDay: event.allDay ?? (noTimePart(event.start) && noTimePart(event.end)),
      start: createDate(event.start, offset),
      end: createDate(event.end, offset),
      title: event.title ?? '',
      editable: event.editable,
      startEditable: event.startEditable,
      durationEditable: event.durationEditable,
      display: event.display ?? 'auto',
      extendedProps: event.extendedProps ?? {},
      backgroundColor: event.backgroundColor ?? event.color,
      textColor: event.textColor,
      classNames: toArrayProp(event, 'className'),
      styles: toArrayProp(event, 'style'),
    };

    if (result.allDay) {
      setMidnight(result.start);
      const end = cloneDate(result.end);
      setMidnight(result.end);
      // Round up: if upstream end had a time portion, advance to next day so
      // an all-day event renders across the right number of cells. Also fix
      // https://github.com/vkurko/calendar/issues/50 (zero-duration all-day).
      if (!datesEqual(result.end, end) || datesEqual(result.end, result.start)) {
        addDay(result.end);
      }
    }

    return result;
  });
}

function toArrayProp(input, propName) {
  const result = input[propName + 's'] ?? input[propName] ?? [];
  return isArray(result) ? result : [result];
}

// Normalise event-source declarations into a uniform shape.
export function createEventSources(input) {
  return input.map((source) => ({
    events: source.events,
    url: (source.url && source.url.replace(/&$/, '')) || '',
    method: (source.method && source.method.toUpperCase()) || 'GET',
    extraParams: source.extraParams || {},
  }));
}

// Cloning — public-API shape vs internal-storage shape.
export function toEventWithLocalDates(event) {
  return _cloneEvent(event, toLocalDate);
}

export function cloneEvent(event) {
  return _cloneEvent(event, cloneDate);
}

function _cloneEvent(event, dateFn) {
  event = assign({}, event);
  event.start = dateFn(event.start);
  event.end = dateFn(event.end);
  return event;
}

// Resize the refs array to `data.length` (drops trailing entries) and call
// `.reposition()` on every remaining ref. Used by per-view components after
// a re-render.
export function runReposition(refs, data) {
  refs.length = data.length;
  for (const ref of refs) ref?.reposition();
}

// Does event intersect a [start, end) window, optionally scoped to a
// resource?
export function eventIntersects(event, start, end, resource = undefined) {
  return (
    (!resource || event.resourceIds.includes(resource.id)) &&
    event.start < end &&
    event.end > start
  );
}

// Display-type predicates — these classify event.display values so callers
// can branch on rendering modes.
export function bgEvent(display)      { return display === 'background'; }
export function previewEvent(display) { return display === 'preview'; }
export function ghostEvent(display)   { return display === 'ghost'; }
export function pointerEvent(display) { return display === 'pointer'; }

// "Helper" events are the synthetic events shown during drag, resize, or
// hover — they need rendering but shouldn't be persisted.
export function helperEvent(display) {
  return previewEvent(display) || ghostEvent(display) || pointerEvent(display);
}

// Private — kept here because createEventContent (which lands with view.js)
// will need it. Exported separately so the unit tests can exercise it.
export function createTimeElement(timeText, chunk, theme) {
  return createElement(
    'time',
    theme.eventTime,
    timeText,
    [['datetime', toISOString(chunk.start)]],
  );
}
