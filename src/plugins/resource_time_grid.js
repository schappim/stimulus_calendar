// Resource + ResourceTimeGrid plugin — registers resourceTimeGridDay /
// resourceTimeGridWeek views (per-resource column TimeGrid). Mirrors
// calendar/packages/core/src/plugins/resource-time-grid/index.js.

import { createDuration } from '../lib/duration.js';
import { undefinedOr } from '../lib/options.js';
import { renderResourceTimeGridView } from '../views/resource_time_grid.js';

export const ResourceTimeGridPlugin = {
  createOptions(options) {
    // Inherit TimeGrid options if TimeGrid isn't loaded.
    if (!('scrollTime' in options)) {
      Object.assign(options, {
        allDayContent: undefined,
        allDaySlot: true,
        slotEventOverlap: true,
        columnWidth: undefined,
        flexibleSlotTimeLimits: false,
        nowIndicator: false,
        scrollTime: '06:00:00',
        slotDuration: '00:30:00',
        slotHeight: 24,
        slotLabelInterval: undefined,
        slotLabelFormat: { hour: 'numeric', minute: '2-digit' },
        slotMaxTime: '24:00:00',
        slotMinTime: '00:00:00',
        snapDuration: undefined,
      });
    }
    Object.assign(options, {
      datesAboveResources: false,
      filterResourcesWithEvents: false,
      filterEventsWithResources: false,
      resourceLabelContent: undefined,
      resourceLabelDidMount: undefined,
      view: 'resourceTimeGridWeek',
    });
    Object.assign(options.buttonText, {
      resourceTimeGridDay: 'day',
      resourceTimeGridWeek: 'week',
    });
    Object.assign(options.theme, {
      colGroup: 'ec-col-group',
      resource: 'ec-resource',
      resourceLabel: 'ec-resource-label',
    });
    Object.assign(options.views, {
      resourceTimeGridDay: {
        component: () => renderResourceTimeGridView,
        dayHeaderFormat: { weekday: 'long' },
        // Default title carries the weekday so it stays informative
        // when the per-lane day label is suppressed (see the
        // days.length > 1 guard in the view's header renderer):
        // "Wednesday, 27 May 2026" instead of the previous
        // "27 May 2026", which on a single-day resource view dropped
        // a useful piece of context the user had to look at the row
        // headers to recover.
        titleFormat: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
        duration: { days: 1 },
      },
      resourceTimeGridWeek: {
        component: () => renderResourceTimeGridView,
        duration: { weeks: 1 },
      },
    });
  },
  createParsers(parsers) {
    if (!('scrollTime' in parsers)) {
      Object.assign(parsers, {
        scrollTime: createDuration,
        slotDuration: createDuration,
        slotLabelInterval: undefinedOr(createDuration),
        slotMaxTime: createDuration,
        slotMinTime: createDuration,
        snapDuration: undefinedOr(createDuration),
      });
    }
  },
};
