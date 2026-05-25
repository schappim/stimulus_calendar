// List plugin — chronological list of events grouped by day. Registers
// listDay, listWeek, listMonth, listYear. Mirrors
// calendar/packages/core/src/plugins/list/index.js.

import { renderListView } from '../views/list.js';

export const ListPlugin = {
  createOptions(options) {
    Object.assign(options, {
      listDayFormat: { weekday: 'long' },
      listDaySideFormat: { year: 'numeric', month: 'long', day: 'numeric' },
      noEventsClick: undefined,
      noEventsContent: 'No events',
      view: 'listWeek',
    });
    Object.assign(options.buttonText, {
      listDay: 'day',
      listWeek: 'week',
      listMonth: 'month',
      listYear: 'year',
    });
    Object.assign(options.theme, {
      daySide: 'ec-day-side',
      eventTag: 'ec-event-tag',
      noEvents: 'ec-no-events',
    });
    Object.assign(options.views, {
      listDay: {
        component: () => renderListView,
        duration: { days: 1 },
        titleFormat: { year: 'numeric', month: 'long', day: 'numeric' },
      },
      listWeek: {
        component: () => renderListView,
        duration: { weeks: 1 },
      },
      listMonth: {
        component: () => renderListView,
        duration: { months: 1 },
        titleFormat: { year: 'numeric', month: 'long' },
      },
      listYear: {
        component: () => renderListView,
        duration: { years: 1 },
        titleFormat: { year: 'numeric' },
      },
    });
  },
};
