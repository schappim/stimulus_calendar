import { describe, it, expect } from 'vitest';
import {
  createResources, createResource,
  eventBackgroundColor, eventTextColor, findFirstResource,
} from '../../src/lib/resources.js';
import { getPayload, hasPayload } from '../../src/lib/payload.js';

describe('lib/resources', () => {
  it('createResource coerces id to string and fills defaults', () => {
    const r = createResource({ id: 7, title: 'Room A' });
    expect(r.id).toBe('7');
    expect(r.title).toBe('Room A');
    expect(r.expanded).toBe(true);
    expect(r.extendedProps).toEqual({});
    expect(r.eventBackgroundColor).toBeUndefined();
  });

  it('createResource honours expanded:false', () => {
    const r = createResource({ id: 'r1', expanded: false });
    expect(r.expanded).toBe(false);
  });

  it('createResources flattens depth-first with payloads', () => {
    const flat = createResources([
      { id: 'a', children: [
        { id: 'a1' },
        { id: 'a2' },
      ]},
      { id: 'b' },
    ]);
    expect(flat.map((r) => r.id)).toEqual(['a', 'a1', 'a2', 'b']);
    const a = flat[0], a1 = flat[1], b = flat[3];
    expect(hasPayload(a)).toBe(true);
    expect(getPayload(a).level).toBe(0);
    expect(getPayload(a1).level).toBe(1);
    expect(getPayload(b).level).toBe(0);
    expect(getPayload(a).children.map((c) => c.id)).toEqual(['a1', 'a2']);
    expect(getPayload(a).hidden).toBe(false);
    expect(getPayload(a1).hidden).toBe(false);
  });

  it('createResources marks descendants hidden when parent is collapsed', () => {
    const flat = createResources([
      { id: 'a', expanded: false, children: [
        { id: 'a1' },
        { id: 'a2', children: [{ id: 'a2x' }] },
      ]},
    ]);
    const a = flat[0], a1 = flat[1], a2 = flat[2], a2x = flat[3];
    expect(getPayload(a).hidden).toBe(false);
    expect(getPayload(a1).hidden).toBe(true);
    expect(getPayload(a2).hidden).toBe(true);
    expect(getPayload(a2x).hidden).toBe(true);
  });

  it('eventBackgroundColor / eventTextColor pass through', () => {
    const r = { eventBackgroundColor: '#abc', eventTextColor: '#fff' };
    expect(eventBackgroundColor(r)).toBe('#abc');
    expect(eventTextColor(r)).toBe('#fff');
    expect(eventBackgroundColor(undefined)).toBeUndefined();
  });

  it('findFirstResource returns the first matching resource by id', () => {
    const resources = [{ id: '1' }, { id: '2' }, { id: '3' }];
    expect(findFirstResource({ resourceIds: ['2', '3'] }, resources)).toEqual({ id: '2' });
    expect(findFirstResource({ resourceIds: [] }, resources)).toBeUndefined();
    expect(findFirstResource({ resourceIds: ['missing'] }, resources)).toBeUndefined();
  });
});
