// Built-in plugin registry. Names like "DayGrid", "TimeGrid", "List", … are
// resolved here when a user passes them via `data-calendar-plugins-value`.

import { DayGridPlugin } from './day_grid.js';
import { TimeGridPlugin } from './time_grid.js';
import { ListPlugin } from './list.js';
import { ResourceTimeGridPlugin } from './resource_time_grid.js';
import { ResourceTimelinePlugin } from './resource_timeline.js';
import { InteractionPlugin } from './interaction.js';

export const PLUGINS = {
  DayGrid: DayGridPlugin,
  TimeGrid: TimeGridPlugin,
  List: ListPlugin,
  Resource: ResourceTimeGridPlugin,
  ResourceTimeGrid: ResourceTimeGridPlugin,
  ResourceTimeline: ResourceTimelinePlugin,
  Interaction: InteractionPlugin,
};

export function resolvePluginNames(names) {
  const resolved = [];
  for (const name of names) {
    if (typeof name === 'string') {
      const plugin = PLUGINS[name];
      if (plugin) resolved.push(plugin);
    } else {
      resolved.push(name);
    }
  }
  return resolved;
}
