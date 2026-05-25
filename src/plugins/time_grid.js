// TimeGrid plugin — registers timeGridWeek, timeGridDay. Mirrors
// calendar/packages/core/src/plugins/time-grid/index.js but renders via
// our pure-JS components.

import { createDuration } from '../lib/duration.js';
import { undefinedOr } from '../lib/options.js';
import { renderTimeGridView } from '../views/time_grid.js';

export const TimeGridPlugin = {
  createOptions(options) {
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
      view: 'timeGridWeek',
    });
    Object.assign(options.buttonText, {
      timeGridDay: 'day',
      timeGridWeek: 'week',
    });
    Object.assign(options.theme, {
      nowIndicator: 'ec-now-indicator',
      sidebar: 'ec-sidebar',
      slot: 'ec-slot',
      allDay: 'ec-all-day',
    });
    Object.assign(options.views, {
      timeGridDay: {
        component: () => renderTimeGridView,
        dayHeaderFormat: { weekday: 'long' },
        duration: { days: 1 },
        titleFormat: { year: 'numeric', month: 'long', day: 'numeric' },
      },
      timeGridWeek: {
        component: () => renderTimeGridView,
        duration: { weeks: 1 },
      },
    });
  },
  createParsers(parsers) {
    Object.assign(parsers, {
      scrollTime: createDuration,
      slotDuration: createDuration,
      slotLabelInterval: undefinedOr(createDuration),
      slotMaxTime: createDuration,
      slotMinTime: createDuration,
      snapDuration: undefinedOr(createDuration),
    });
  },
};
