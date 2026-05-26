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

// Pack a set of time-bounded items into vertical lanes so overlapping
// items get a distinct lane within a shared CLUSTER.
//
// `items` is an array of `{ start, end, ... }`. Returns a Map<item,
// { lane, cluster }> where:
//
//   - lane is a 0-based column within the cluster, picked as the
//     SMALLEST free lane each step (so a sequence of short events
//     between a tall one all reuse the first free column instead of
//     spilling rightward);
//   - cluster is a shared-by-reference `{ laneCount }` object whose
//     `laneCount` is the column count for the whole transitive
//     overlap group. Because it's shared, a late-arriving third event
//     that bumps laneCount from 2 → 3 also widens the layout of the
//     earlier two events without a re-pass.
//
// Algorithm (sweep-line, mirroring mobile_schedule_controller +
// _schedule_day_pane.html.erb so server-rendered and client-relayed-out
// lanes produce identical numbers):
//
//   1. Sort items by start (ascending), then end (ascending).
//   2. Walk the list keeping `active` = items whose end > current.start.
//   3. Evict expired (end ≤ current.start) → if active goes empty,
//      open a fresh cluster.
//   4. Smallest-free-lane: collect used = Set(active.map(.lane)),
//      lane = 0 while used.has(lane) lane++. Assign + push.
//   5. cluster.laneCount = max(cluster.laneCount, lane + 1).
//
// Items with start === end (zero-length) are treated as occupying a
// 30-minute slot for overlap detection so an "instant" event doesn't
// render as a 1-px sliver invisible under the next one.
const MIN_OVERLAP_MS = 30 * 60_000;
export function assignOverlapLanes(items) {
  const sorted = [...items].sort((a, b) => {
    const sa = a.start.getTime(), sb = b.start.getTime();
    if (sa !== sb) return sa - sb;
    return a.end.getTime() - b.end.getTime();
  });
  const result = new Map();
  let active = [];
  let cluster = null;
  for (const item of sorted) {
    const startMs = item.start.getTime();
    const effectiveEnd = Math.max(item.end.getTime(), startMs + MIN_OVERLAP_MS);
    // Evict items that ended at or before this one's start (half-open
    // intervals — touching but not overlapping events don't fan apart).
    active = active.filter((a) => a.endMs > startMs);
    if (active.length === 0) cluster = { laneCount: 0 };
    // Smallest free lane.
    const used = new Set(active.map((a) => a.lane));
    let lane = 0;
    while (used.has(lane)) lane += 1;
    cluster.laneCount = Math.max(cluster.laneCount, lane + 1);
    result.set(item, { lane, cluster });
    active.push({ item, lane, endMs: effectiveEnd });
    // Keep first-to-expire at the front so the next iteration's filter
    // touches the relevant entries first. Doesn't change correctness.
    active.sort((a, b) => a.endMs - b.endMs);
  }
  return result;
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
