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
      // Phase A1 — Roster grouping. Two ways to feed groups:
      //   (a) explicit list:  resourceGroups: [{ id, title, color,
      //       resourceIds, expanded }]
      //   (b) derive from a field on each resource:
      //       resourceGroupField: 'crewId'
      // When both are supplied the explicit list wins. Resources with no
      // matching group render as flat siblings — no "Unaffiliated" header.
      resourceGroups: undefined,
      resourceGroupField: undefined,
      // When at least one explicit group is defined and there are
      // resources that don't match any group, the renderer wraps the
      // leftovers in a synthetic "Other" group so they're visually
      // separated from the named crews. Set to null / '' to opt out
      // and keep the flat tail (the pre-Phase A1 behaviour).
      ungroupedGroupTitle: 'Other',
      groupHeaderContent: undefined,
      groupHeaderDidMount: undefined,
      // Phase A3 — per-cell quick-add affordance + cellClick.
      //   emptyCellAddButton: false | true | (ctx) => htmlOrText
      //   cellClick: ({ date, resource, group, jsEvent, view }) => …
      // cellClick is distinct from dateClick (which the Interaction
      // plugin fires from the underlying calendar background); cellClick
      // always carries { date, resource, group } so the host can open
      // its "new appointment for crew Y on day Z" sheet pre-filled.
      emptyCellAddButton: undefined,
      cellClick: undefined,
      // Phase A7 — bars narrower than this (px) get .ec-event-narrow so
      // per-bar CSS can hide secondary text (time meta, subtitle).
      eventNarrowThreshold: 60,
      // Phase B1/B3 — slot mode. Default 'days' keeps Phase 9 behaviour
      // (one column per day). 'hours' switches the resource timeline
      // into a per-day, per-hour column grid (uses slotMinTime /
      // slotMaxTime to bound the hour range). The view's day count is
      // derived from options.duration as usual; in hours mode every day
      // gets HOURS = (slotMaxTime - slotMinTime) / 1h columns.
      slotMode: 'days',
      // Phase B5 — pinch-to-zoom row height. compactRowHeight (px) and
      // comfyRowHeight (px) are the two slots the gesture toggles
      // between; the active height lives on state.rowHeight and is
      // surfaced as inline --ec-timeline-row-h on the root.
      allowPinchZoom: false,
      compactRowHeight: 52,
      comfyRowHeight: 88,
      // Phase B6 — TODAY day-number style. 'cell-tint' (default) keeps
      // the existing behaviour; 'circle' wraps the day number in an
      // accent-filled circle (iOS Calendar pattern).
      dayHeaderTodayStyle: 'cell-tint',
      // Optional shaded lunch hour band inside hours-mode (CSS-only).
      lunchHour: undefined,
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
      // Phase A1 — group header row above each crew's resource rows.
      groupHeader:        'ec-group-header',
      groupHeaderSwatch:  'ec-group-header-swatch',
      groupHeaderToggle:  'ec-group-header-toggle',
      groupHeaderName:    'ec-group-header-name',
      groupHeaderCount:   'ec-group-header-count',
      groupHeaderAction:  'ec-group-header-action',
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
      // Phase B2 — 28-day compressed Gantt. Renders 4 weeks of daily
      // columns; the renderer's narrow auto-class kicks in for most
      // bars at this density. Today-circle is the recommended dayHead
      // style here (matches iOS Calendar at month zoom).
      resourceTimelineMonth4w: {
        component: () => renderResourceTimelineView,
        dayHeaderFormat: { day: 'numeric' },
        duration: { weeks: 4 },
        slotDuration: { days: 1 },
        slotWidth: 36,
        dayHeaderTodayStyle: 'circle',
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
