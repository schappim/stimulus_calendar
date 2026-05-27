import { describe, it, expect } from 'vitest';
import { buildResourceGroupLayout } from '../../src/lib/resource_groups.js';

describe('buildResourceGroupLayout', () => {
  const r = (id, extra = {}) => ({ id, title: id, extendedProps: {}, ...extra });

  it('emits group headers in the declared order and resources beneath each', () => {
    const { layout } = buildResourceGroupLayout({
      resources: [r('will'), r('mike'), r('sam'), r('joe')],
      resourceGroups: [
        { id: 'a', title: 'Crew A', resourceIds: ['will', 'mike'], expanded: true },
        { id: 'b', title: 'Crew B', resourceIds: ['sam'],          expanded: true },
      ],
      resourceGroupField: undefined,
      groupState: new Map(),
    });
    const kinds = layout.map((e) => e.kind);
    expect(kinds).toEqual(['group','resource','resource','group','resource','resource']);
    expect(layout[0].group.title).toBe('Crew A');
    expect(layout[1].resource.id).toBe('will');
    expect(layout[2].resource.id).toBe('mike');
    expect(layout[3].group.title).toBe('Crew B');
    expect(layout[4].resource.id).toBe('sam');
    expect(layout[5].resource.id).toBe('joe');           // ungrouped → tail
    expect(layout[5].group).toBeNull();
  });

  it('honours groupState over the declared expanded flag', () => {
    const groupState = new Map([['a', false]]);
    const { layout } = buildResourceGroupLayout({
      resources: [r('will'), r('mike')],
      resourceGroups: [
        { id: 'a', title: 'Crew A', resourceIds: ['will','mike'], expanded: true },
      ],
      groupState,
    });
    expect(layout.map((e) => e.kind)).toEqual(['group']);
    expect(layout[0].group.expanded).toBe(false);
  });

  it('derives groups from resourceGroupField when no explicit list', () => {
    const { layout, groupsById } = buildResourceGroupLayout({
      resources: [
        r('will', { crewId: 'a' }),
        r('mike', { crewId: 'a' }),
        r('sam',  { crewId: 'b' }),
        r('joe'),
      ],
      resourceGroups: undefined,
      resourceGroupField: 'crewId',
      groupState: new Map(),
    });
    expect(groupsById.size).toBe(2);
    expect(groupsById.get('a').resourceIds).toEqual(['will','mike']);
    expect(groupsById.get('b').resourceIds).toEqual(['sam']);
    const kinds = layout.map((e) => e.kind);
    expect(kinds).toEqual(['group','resource','resource','group','resource','resource']);
    expect(layout[5].resource.id).toBe('joe');
    expect(layout[5].group).toBeNull();
  });

  it('reads groupField from extendedProps too', () => {
    const { layout, groupsById } = buildResourceGroupLayout({
      resources: [r('will', { extendedProps: { crewId: 'a' } })],
      resourceGroupField: 'crewId',
      groupState: new Map(),
    });
    expect(groupsById.size).toBe(1);
    expect(layout.map((e) => e.kind)).toEqual(['group','resource']);
  });
});
