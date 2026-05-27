import { describe, it, expect } from 'vitest';
import { buildResourceGroupLayout } from '../../src/lib/resource_groups.js';

describe('buildResourceGroupLayout', () => {
  const r = (id, extra = {}) => ({ id, title: id, extendedProps: {}, ...extra });

  it('emits group headers in the declared order and resources beneath each', () => {
    const { layout, groupsById } = buildResourceGroupLayout({
      resources: [r('will'), r('mike'), r('sam'), r('joe')],
      resourceGroups: [
        { id: 'a', title: 'Crew A', resourceIds: ['will', 'mike'], expanded: true },
        { id: 'b', title: 'Crew B', resourceIds: ['sam'],          expanded: true },
      ],
      resourceGroupField: undefined,
      groupState: new Map(),
    });
    const kinds = layout.map((e) => e.kind);
    // Ungrouped 'joe' now sits under a synthetic "Other" parent.
    expect(kinds).toEqual([
      'group','resource','resource',
      'group','resource',
      'group','resource',
    ]);
    expect(layout[0].group.title).toBe('Crew A');
    expect(layout[3].group.title).toBe('Crew B');
    expect(layout[5].group.id).toBe('__ungrouped');
    expect(layout[5].group.title).toBe('Other');
    expect(layout[6].resource.id).toBe('joe');
    expect(layout[6].group.id).toBe('__ungrouped');
    expect(groupsById.get('__ungrouped').synthetic).toBe(true);
  });

  it('opts out of the synthetic Other group when ungroupedTitle is null', () => {
    const { layout, groupsById } = buildResourceGroupLayout({
      resources: [r('will'), r('joe')],
      resourceGroups: [
        { id: 'a', title: 'Crew A', resourceIds: ['will'], expanded: true },
      ],
      ungroupedTitle: null,
      groupState: new Map(),
    });
    expect(layout.map((e) => e.kind)).toEqual(['group','resource','resource']);
    expect(layout[2].group).toBeNull();
    expect(groupsById.has('__ungrouped')).toBe(false);
  });

  it('keeps resources flat when there are no explicit groups at all', () => {
    const { layout } = buildResourceGroupLayout({
      resources: [r('will'), r('joe')],
      resourceGroups: undefined,
      resourceGroupField: undefined,
      groupState: new Map(),
    });
    expect(layout.map((e) => e.kind)).toEqual(['resource','resource']);
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

  it('derives groups from resourceGroupField when no explicit list, with synthetic Other', () => {
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
    expect(groupsById.size).toBe(3);
    expect(groupsById.get('a').resourceIds).toEqual(['will','mike']);
    expect(groupsById.get('b').resourceIds).toEqual(['sam']);
    expect(groupsById.get('__ungrouped').resourceIds).toEqual(['joe']);
    expect(layout.map((e) => e.kind)).toEqual([
      'group','resource','resource',
      'group','resource',
      'group','resource',
    ]);
    expect(layout[6].resource.id).toBe('joe');
    expect(layout[6].group.id).toBe('__ungrouped');
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
