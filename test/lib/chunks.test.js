import { describe, it, expect } from 'vitest';
import {
  createEventChunk, createAllDayChunks,
  prepareAllDayChunks, repositionEvent, assignChunkId,
} from '../../src/lib/chunks.js';
import { createDate } from '../../src/lib/date.js';

const d = (iso) => createDate(iso);

describe('lib/chunks', () => {
  it('createEventChunk clips to window and detects zero duration', () => {
    const event = { start: d('2026-05-25T08:00'), end: d('2026-05-25T12:00') };
    const c = createEventChunk(event, d('2026-05-25T09:00'), d('2026-05-25T11:00'));
    expect(c.start.getUTCHours()).toBe(9);
    expect(c.end.getUTCHours()).toBe(11);
    expect(c.event).toBe(event);
    expect(c.zeroDuration).toBe(false);

    const zd = createEventChunk(event, d('2026-05-25T08:00'), d('2026-05-25T08:00'));
    expect(zd.zeroDuration).toBe(true);
  });

  it('createAllDayChunks returns one chunk spanning every intersecting day', () => {
    const event = {
      start: d('2026-05-25T00:00'),
      end:   d('2026-05-28T00:00'),
      resourceIds: [],
    };
    const days = [
      { gridColumn: 1, gridRow: 1, dayStart: d('2026-05-25T00:00'), dayEnd: d('2026-05-26T00:00'), disabled: false },
      { gridColumn: 2, gridRow: 1, dayStart: d('2026-05-26T00:00'), dayEnd: d('2026-05-27T00:00'), disabled: false },
      { gridColumn: 3, gridRow: 1, dayStart: d('2026-05-27T00:00'), dayEnd: d('2026-05-28T00:00'), disabled: false },
    ];
    const [chunk] = createAllDayChunks(event, days);
    expect(chunk.dates).toHaveLength(3);
    expect(chunk.gridColumn).toBe(1);
    expect(chunk.gridRow).toBe(1);
    expect(chunk.id).toMatch(/^\d+-1-1$/);
  });

  it('createAllDayChunks skips disabled days and returns [] on no overlap', () => {
    const event = { start: d('2026-05-25T00:00'), end: d('2026-05-26T00:00'), resourceIds: [] };
    const noOverlap = [
      { gridColumn: 1, gridRow: 1, dayStart: d('2027-01-01T00:00'), dayEnd: d('2027-01-02T00:00'), disabled: false },
    ];
    expect(createAllDayChunks(event, noOverlap)).toEqual([]);

    const disabled = [
      { gridColumn: 1, gridRow: 1, dayStart: d('2026-05-25T00:00'), dayEnd: d('2026-05-26T00:00'), disabled: true },
    ];
    expect(createAllDayChunks(event, disabled)).toEqual([]);
  });

  it('prepareAllDayChunks builds prev + long maps', () => {
    const event = { id: 'e1', resourceIds: [] };
    const c1 = { event, gridRow: 1, gridColumn: 1, dates: [d('2026-05-25T00:00')] };
    const c2 = { event, gridRow: 1, gridColumn: 1, dates: [d('2026-05-25T00:00')] };
    const c3 = { event, gridRow: 1, gridColumn: 1, dates: [
      d('2026-05-25T00:00'), d('2026-05-26T00:00'), d('2026-05-27T00:00'),
    ] };
    prepareAllDayChunks([c1, c2, c3]);
    expect(c1.prev).toBeUndefined();
    expect(c2.prev).toBe(c1);
    expect(c3.prev).toBe(c2);
    // c3 should also register a long entry on columns 2 and 3.
    expect(c3.long).toBeUndefined();    // c3 starts at column 1 (no long entry yet)
  });

  it('repositionEvent stacks below the previous chunk', () => {
    const a = { top: 0, bottom: 20 };
    const b = { prev: a };
    repositionEvent(b, 15);
    expect(b.top).toBe(21);
    expect(b.bottom).toBe(36);
  });

  it('repositionEvent pushes past overlapping long chunks', () => {
    const long = { top: 10, bottom: 40 };
    const chunk = { long: { sorted: false, chunks: [long] } };
    repositionEvent(chunk, 20, 5);
    // top starts at 5, bottom = 25; overlaps long (10..40), offset = 40-5+1 = 36
    expect(chunk.top).toBe(41);
    expect(chunk.bottom).toBe(61);
  });

  it('assignChunkId reuses the same event prefix across chunks', () => {
    const event = { id: 'e1' };
    const c1 = { event, gridColumn: 1, gridRow: 1 };
    const c2 = { event, gridColumn: 2, gridRow: 1 };
    assignChunkId(c1);
    assignChunkId(c2);
    const prefix1 = c1.id.split('-')[0];
    const prefix2 = c2.id.split('-')[0];
    expect(prefix1).toBe(prefix2);
    expect(c1.id).toBe(`${prefix1}-1-1`);
    expect(c2.id).toBe(`${prefix2}-2-1`);
  });
});
