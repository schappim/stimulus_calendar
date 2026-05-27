// Port of calendar/packages/core/src/lib/resources.js (vkurko/calendar v5.7.1).
// Flattens a nested resource tree into a flat ordered array while keeping
// parent/child structure in the per-resource payload.

import { setPayload } from './payload.js';
import { empty } from './utils.js';

// Normalise + flatten an array of input resources. Returns a flat array
// (DFS order) where each resource has a payload of { level, children,
// hidden } attached via the private Symbol slot.
export function createResources(input) {
  const result = [];
  _createResources(input, 0, false, result);
  return result;
}

function _createResources(input, level, hidden, flat) {
  const result = [];
  for (const item of input) {
    const resource = createResource(item);
    result.push(resource);
    flat.push(resource);
    const payload = { level, children: [], hidden };
    setPayload(resource, payload);
    if (item.children) {
      payload.children = _createResources(
        item.children,
        level + 1,
        hidden || !resource.expanded,
        flat,
      );
    }
  }
  return result;
}

// Coerce a raw resource input into the canonical shape used everywhere.
export function createResource(input) {
  return {
    id: String(input.id),
    title: input.title || '',
    eventBackgroundColor: eventBackgroundColor(input),
    eventTextColor: eventTextColor(input),
    expanded: input.expanded ?? true,
    // S8 — visibility toggle. Default true so existing consumers see
    // no behaviour change. Setting `visible: false` removes the
    // resource (and, by extension, any nested children below the
    // hidden parent) from the rendered roster without forcing a
    // refetch.
    visible: input.visible ?? true,
    workingHours: input.workingHours ?? null,
    extendedProps: input.extendedProps ?? {},
  };
}

export function eventBackgroundColor(resource) {
  return resource?.eventBackgroundColor;
}

export function eventTextColor(resource) {
  return resource?.eventTextColor;
}

// Look up the first resource on an event (used when an event only needs to
// know about its primary resource — e.g. for event colouring).
export function findFirstResource(event, resources) {
  return empty(event.resourceIds)
    ? undefined
    : resources.find((resource) => event.resourceIds.includes(resource.id));
}
