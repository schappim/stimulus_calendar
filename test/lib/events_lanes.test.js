// Unit coverage for the sweep-line lane packer in lib/events.js. The
// same algorithm runs on every TimeGrid / ResourceTimeGrid re-render
// and is the authority for "how do overlapping chips fan into
// columns" — server-rendered and client-relayed-out lane numbers must
// match.

import { describe, it, expect } from 'vitest';
import { assignOverlapLanes } from '../../src/lib/events.js';

// Helper — turn [{ id, startMin, endMin }] into events with real Dates
// anchored on the same arbitrary midnight, so the lane packer sees
// monotonic timestamps.
const BASE = Date.UTC(2026, 4, 25);
function ev(id, startMin, endMin) {
  return {
    id,
    start: new Date(BASE + startMin * 60_000),
    end:   new Date(BASE + endMin   * 60_000),
  };
}

describe('assignOverlapLanes — sweep-line cluster packer', () => {
  it('single event lands at lane 0 with laneCount 1', () => {
    const a = ev('a', 9 * 60, 10 * 60);
    const map = assignOverlapLanes([a]);
    expect(map.get(a).lane).toBe(0);
    expect(map.get(a).cluster.laneCount).toBe(1);
  });

  it('two overlapping events share a cluster of laneCount 2', () => {
    const a = ev('a', 9 * 60, 10 * 60);
    const b = ev('b', 9 * 60 + 30, 10 * 60 + 30);
    const map = assignOverlapLanes([a, b]);
    expect(map.get(a).lane).toBe(0);
    expect(map.get(b).lane).toBe(1);
    // Cluster.laneCount is shared by reference so updating one is
    // reflected in the other.
    expect(map.get(a).cluster).toBe(map.get(b).cluster);
    expect(map.get(a).cluster.laneCount).toBe(2);
  });

  it('three transitively overlapping events fan to lanes 0/1/2 (laneCount 3)', () => {
    // A: 09:00 – 10:30, B: 10:00 – 11:00, C: 10:15 – 12:30 — A∩B, B∩C,
    // A∩C are all non-empty but the cluster is also transitively closed.
    const a = ev('a', 9 * 60,        10 * 60 + 30);
    const b = ev('b', 10 * 60,       11 * 60);
    const c = ev('c', 10 * 60 + 15,  12 * 60 + 30);
    const map = assignOverlapLanes([a, b, c]);
    expect(map.get(a).lane).toBe(0);
    expect(map.get(b).lane).toBe(1);
    expect(map.get(c).lane).toBe(2);
    expect(map.get(a).cluster.laneCount).toBe(3);
    expect(map.get(a).cluster).toBe(map.get(b).cluster);
    expect(map.get(b).cluster).toBe(map.get(c).cluster);
  });

  it('opens a fresh cluster when active goes empty (touching but not overlapping)', () => {
    // A: 09:00 – 10:00, B: 10:00 – 11:00, C: 10:15 – 12:30.
    // A.end == B.start so A is evicted at B's start — A is alone in its
    // cluster, {B, C} share a separate cluster of laneCount 2.
    const a = ev('a',  9 * 60,       10 * 60);
    const b = ev('b', 10 * 60,       11 * 60);
    const c = ev('c', 10 * 60 + 15,  12 * 60 + 30);
    const map = assignOverlapLanes([a, b, c]);
    expect(map.get(a).cluster.laneCount).toBe(1);
    expect(map.get(b).cluster.laneCount).toBe(2);
    expect(map.get(a).cluster).not.toBe(map.get(b).cluster);
    expect(map.get(b).cluster).toBe(map.get(c).cluster);
  });

  it('reuses the smallest free lane when a short event sits between two tall ones', () => {
    // Tall A: 09:00 – 12:00 (sits on lane 0 the whole time).
    // Short B: 09:15 – 09:45 → lane 1.
    // Short C: 10:00 – 10:30 → should reuse lane 1, NOT spill to lane 2.
    const a = ev('a',  9 * 60,        12 * 60);
    const b = ev('b',  9 * 60 + 15,    9 * 60 + 45);
    const c = ev('c', 10 * 60,        10 * 60 + 30);
    const map = assignOverlapLanes([a, b, c]);
    expect(map.get(a).lane).toBe(0);
    expect(map.get(b).lane).toBe(1);
    expect(map.get(c).lane).toBe(1);
    // All three share the same cluster (A is active through B and C).
    expect(map.get(a).cluster.laneCount).toBe(2);
  });

  it('treats a zero-length event as a 30-min slot for overlap detection', () => {
    // A at 10:00 – 10:00 (instant). B at 10:15 – 10:45 — would NOT
    // overlap A if A were treated as zero-length. Lane packer's 30-min
    // floor means A occupies [10:00, 10:30), which DOES overlap B.
    const a = ev('a', 10 * 60, 10 * 60);
    const b = ev('b', 10 * 60 + 15, 10 * 60 + 45);
    const map = assignOverlapLanes([a, b]);
    expect(map.get(a).cluster).toBe(map.get(b).cluster);
    expect(map.get(a).cluster.laneCount).toBe(2);
  });

  it('insertion order does not affect lane numbers (stable across permutations)', () => {
    const evts = [
      ev('a',  9 * 60,       10 * 60 + 30),
      ev('b', 10 * 60,       11 * 60),
      ev('c', 10 * 60 + 15,  12 * 60 + 30),
    ];
    const sorted = assignOverlapLanes(evts);
    const reversed = assignOverlapLanes([...evts].reverse());
    for (const e of evts) {
      expect(reversed.get(e).lane).toBe(sorted.get(e).lane);
      expect(reversed.get(e).cluster.laneCount).toBe(sorted.get(e).cluster.laneCount);
    }
  });
});
