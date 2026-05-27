// Resource-group helper for the Roster ResourceTimeline view.
//
// Given the user's options.resourceGroups (explicit) and/or
// options.resourceGroupField (derive from a resource property), plus the
// flat resources array the controller has already produced, return an
// ordered render plan:
//
//   [
//     { kind: 'group',    group: { id, title, color, expanded } },
//     { kind: 'resource', resource: <r1>, group },
//     { kind: 'resource', resource: <r2>, group },
//     { kind: 'group',    group: { id, title, color, expanded } },
//     …,
//     { kind: 'group',    group: { id: '__ungrouped', title: 'Other', … } },
//     { kind: 'resource', resource: <r3>, group },
//   ]
//
// When at least one explicit group exists AND there are resources that
// don't match any group, the helper auto-emits a trailing synthetic
// group with id "__ungrouped" so the leftover resources have a parent
// header above them (rather than floating loose under the last crew's
// expander). The title comes from options.ungroupedTitle (default
// "Other"); pass `null` / `false` to opt out and keep the flat tail.
//
// When NO explicit groups exist (and no resourceGroupField derives one),
// the helper returns the resources flat with no headers at all — a
// pure resource list, the existing pre-Phase-A1 behaviour.

export function buildResourceGroupLayout({
  resources, resourceGroups, resourceGroupField, groupState,
  ungroupedTitle = 'Other',
}) {
  const groupsById = new Map();
  const orderedGroupIds = [];

  // Explicit list takes priority. We clone each entry so we can read the
  // expansion state from groupState (the live store) without mutating the
  // user-provided source array.
  if (Array.isArray(resourceGroups)) {
    for (const g of resourceGroups) {
      const id = String(g.id);
      const liveExpanded = groupState.get(id);
      groupsById.set(id, {
        id,
        title: g.title ?? '',
        color: g.color,
        resourceIds: Array.isArray(g.resourceIds) ? g.resourceIds.map(String) : [],
        action: g.action,
        expanded: liveExpanded ?? g.expanded ?? true,
      });
      orderedGroupIds.push(id);
    }
  }

  // Field-derived groups fill in any group that the resource references
  // but wasn't declared in resourceGroups (or, when resourceGroups is
  // absent, build the whole map from the resource field).
  if (resourceGroupField) {
    for (const r of resources) {
      const raw = r[resourceGroupField] ?? r.extendedProps?.[resourceGroupField];
      if (raw == null || raw === '') continue;
      const id = String(raw);
      if (!groupsById.has(id)) {
        const liveExpanded = groupState.get(id);
        groupsById.set(id, {
          id,
          title: r[`${resourceGroupField}Title`] ?? r.extendedProps?.[`${resourceGroupField}Title`] ?? id,
          color: r[`${resourceGroupField}Color`] ?? r.extendedProps?.[`${resourceGroupField}Color`],
          resourceIds: [],
          expanded: liveExpanded ?? true,
        });
        orderedGroupIds.push(id);
      }
      const grp = groupsById.get(id);
      if (!grp.resourceIds.includes(r.id)) grp.resourceIds.push(r.id);
    }
  }

  const assignedIds = new Set();
  for (const g of groupsById.values()) for (const id of g.resourceIds) assignedIds.add(id);

  const layout = [];
  for (const gid of orderedGroupIds) {
    const grp = groupsById.get(gid);
    if (!grp) continue;
    layout.push({ kind: 'group', group: grp });
    if (!grp.expanded) continue;
    for (const rid of grp.resourceIds) {
      const r = resources.find((x) => x.id === rid);
      if (r) layout.push({ kind: 'resource', resource: r, group: grp });
    }
  }

  // Ungrouped resources. Two modes:
  //   - groups exist + ungroupedTitle is set
  //         → wrap leftovers in a synthetic "Other" group so the user
  //           gets a clear separation from the named crews.
  //   - no explicit groups
  //         → render flat (the original Phase 9 behaviour).
  const ungrouped = resources.filter((r) => !assignedIds.has(r.id));
  if (ungrouped.length === 0) return { layout, groupsById };

  const haveExplicitGroups = orderedGroupIds.length > 0;
  if (haveExplicitGroups && ungroupedTitle) {
    const ungroupedId = '__ungrouped';
    const liveExpanded = groupState.get(ungroupedId);
    const grp = {
      id: ungroupedId,
      title: ungroupedTitle,
      color: undefined,
      resourceIds: ungrouped.map((r) => r.id),
      expanded: liveExpanded ?? true,
      synthetic: true,
    };
    groupsById.set(ungroupedId, grp);
    layout.push({ kind: 'group', group: grp });
    if (grp.expanded) {
      for (const r of ungrouped) layout.push({ kind: 'resource', resource: r, group: grp });
    }
  } else {
    for (const r of ungrouped) layout.push({ kind: 'resource', resource: r, group: null });
  }
  return { layout, groupsById };
}
