// ResourceTimeline plugin — timeline layout (time horizontal, resources
// vertical). Registers resourceTimelineDay/Week/Month/Year.

import { createDuration } from '../lib/duration.js';
import { undefinedOr } from '../lib/options.js';
import { renderResourceTimelineView } from '../views/resource_timeline.js';

export const ResourceTimelinePlugin = {
  createOptions(options) {
    if (!('scrollTime' in options)) {
      Object.assign(options, {
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
    if (!('resourceLabelContent' in options)) {
      options.filterResourcesWithEvents = false;
      options.resourceLabelContent = undefined;
      options.resourceLabelDidMount = undefined;
    }
    Object.assign(options, {
      monthHeaderFormat: { month: 'long' },
      resourceExpand: undefined,
      slotWidth: 32,
      view: 'resourceTimelineWeek',
    });
    Object.assign(options.buttonText, {
      expand: 'Expand',
      collapse: 'Collapse',
      resourceTimelineDay: 'day',
      resourceTimelineWeek: 'week',
      resourceTimelineMonth: 'month',
      resourceTimelineYear: 'year',
    });
    Object.assign(options.icons, {
      collapse: { html: '&minus;' },
      expand: { html: '&plus;' },
    });
    Object.assign(options.theme, {
      expander: 'ec-expander',
      rowHead: 'ec-row-head',
      slots: 'ec-slots',
      timeline: 'ec-timeline',
    });
    Object.assign(options.views, {
      resourceTimelineDay: {
        component: () => renderResourceTimelineView,
        dayHeaderFormat: { weekday: 'long' },
        duration: { days: 1 },
        titleFormat: { year: 'numeric', month: 'long', day: 'numeric' },
      },
      resourceTimelineWeek: {
        component: () => renderResourceTimelineView,
        duration: { weeks: 1 },
      },
      resourceTimelineMonth: {
        component: () => renderResourceTimelineView,
        dayHeaderFormat: { weekday: 'short', day: 'numeric' },
        duration: { months: 1 },
        slotDuration: { days: 1 },
        titleFormat: { year: 'numeric', month: 'long' },
      },
      resourceTimelineYear: {
        component: () => renderResourceTimelineView,
        dayHeaderFormat: { weekday: 'short', day: 'numeric' },
        duration: { years: 1 },
        slotDuration: { days: 1 },
        titleFormat: { year: 'numeric' },
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
