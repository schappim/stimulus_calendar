// Port of calendar/packages/core/src/lib/chunks.js (vkurko/calendar v5.7.1).
// An event chunk represents one rendered piece of an event — for a single-
// day event, that's the whole event; for a multi-day or all-day event that
// spans rows or columns, multiple chunks are produced. Chunks carry the
// layout coordinates (gridColumn, gridRow, top, bottom, prev, long) used
// by the view components.

import { datesEqual } from './date.js';
import { eventIntersects } from './events.js';
import { assign } from './utils.js';

// Build one chunk for an event clipped to the [start, end) window.
export function createEventChunk(event, start, end) {
  start = event.start > start ? event.start : start;
  end = event.end < end ? event.end : end;
  return {
    start,
    end,
    event,
    zeroDuration: datesEqual(start, end),
  };
}

// For an all-day event, walk every visible day and emit a single chunk that
// spans the days the event intersects. `days` is an array of day descriptors
// `{ gridColumn, gridRow, resource, dayStart, dayEnd, disabled }`.
export function createAllDayChunks(event, days, withId = true) {
  const dates = [];
  let lastEnd;
  let gridColumn;
  let gridRow;
  let resource;
  for (const { gridColumn: column, gridRow: row, resource: dayResource, dayStart, dayEnd, disabled } of days) {
    if (!disabled && eventIntersects(event, dayStart, dayEnd, dayResource)) {
      dates.push(dayStart);
      lastEnd = dayEnd;
      if (!gridColumn) {
        gridColumn = column;
        gridRow = row;
        resource = dayResource;
      }
    }
  }
  if (dates.length) {
    const chunk = createEventChunk(event, dates[0], lastEnd);
    assign(chunk, { gridColumn, gridRow, resource, dates });
    if (withId) assignChunkId(chunk);
    return [chunk];
  }
  return [];
}

// After chunks have layout coords, group them per-(row, column) so the
// renderer can stack overlapping chunks vertically. Each chunk's `prev`
// points at the chunk above it in its cell; `long` lists every chunk that
// also occupies the same row across other columns (for overlap fixups).
export function prepareAllDayChunks(chunks) {
  const prevChunks = {};
  const longChunks = {};
  for (const chunk of chunks) {
    const { gridColumn, gridRow } = chunk;
    // Long-running chunks visit each column they span.
    for (let i = 1; i < chunk.dates.length; ++i) {
      const key = `${gridRow}_${gridColumn + i}`;
      if (longChunks[key]) {
        longChunks[key].chunks.push(chunk);
      } else {
        longChunks[key] = { sorted: false, chunks: [chunk] };
      }
    }
    const key = `${gridRow}_${gridColumn}`;
    chunk.long = longChunks[key];
    chunk.prev = prevChunks[key];
    prevChunks[key] = chunk;
  }
}

// Stack a chunk vertically: bumps `top` past any overlapping long-running
// chunks in the same row. Returns the resolved top so callers can chain.
export function repositionEvent(chunk, height, top = 1) {
  if (chunk.prev) top = chunk.prev.bottom + 1;
  let bottom = top + height;
  if (chunk.long) {
    const long = chunk.long;
    if (!long.sorted) {
      long.chunks.sort((a, b) => a.top - b.top);
      long.sorted = true;
    }
    for (const longChunk of long.chunks) {
      if (top < longChunk.bottom && bottom > longChunk.top) {
        const offset = longChunk.bottom - top + 1;
        top += offset;
        bottom += offset;
      }
    }
  }
  assign(chunk, { top, bottom });
  return top;
}

// Generate a stable id for a chunk so Svelte (and our DOM diff) can identify
// it across renders. Event identity is held in a WeakMap so multiple chunks
// of the same event share the same numeric prefix.
const ids = new WeakMap();
let idCounter = 1;

export function assignChunkId(chunk) {
  const { event, gridColumn, gridRow } = chunk;
  let id = ids.get(event);
  if (!id) {
    id = idCounter++;
    ids.set(event, id);
  }
  chunk.id = `${id}-${gridColumn}-${gridRow}`;
}
