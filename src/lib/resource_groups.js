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
//     { kind: 'resource', resource: <ungrouped> },   // group === null
//   ]
//
// Resources that don't match any group land in a trailing flat region
// with no group header above them (mockup §roster shows this as
// "no header, just rows" — there is no "Unaffiliated" stub).
//
// Group expansion is stored on the group object itself (mutable in place
// so the caller's setGroupExpanded works without re-deriving the whole
// list every time the user toggles a chevron).

export function buildResourceGroupLayout({ resources, resourceGroups, resourceGroupField, groupState }) {
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
  for (const r of resources) {
    if (!assignedIds.has(r.id)) layout.push({ kind: 'resource', resource: r, group: null });
  }
  return { layout, groupsById };
}
