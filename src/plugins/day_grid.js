// DayGrid plugin — registers the dayGridMonth, dayGridWeek, dayGridDay views.
// Mirrors calendar/packages/core/src/plugins/day-grid/index.js but renders
// via our pure-JS components instead of Svelte.

import { renderDayGridView } from '../views/day_grid.js';

export const DayGridPlugin = {
  createOptions(options) {
    Object.assign(options, {
      dayMaxEvents: false,
      dayCellFormat: { day: 'numeric' },
      dayPopoverFormat: { month: 'long', day: 'numeric', year: 'numeric' },
      moreLinkContent: undefined,
      weekNumbers: false,
      weekNumberContent: undefined,
      view: 'dayGridMonth',
    });
    Object.assign(options.buttonText, {
      dayGridDay: 'day',
      dayGridMonth: 'month',
      dayGridWeek: 'week',
      close: 'Close',
    });
    Object.assign(options.theme, {
      uniform: 'ec-uniform',
      dayFoot: 'ec-day-foot',
      otherMonth: 'ec-other-month',
      popup: 'ec-popup',
    });
    Object.assign(options.views, {
      dayGridDay: {
        component: () => renderDayGridView,
        dayHeaderFormat: { weekday: 'long' },
        displayEventEnd: false,
        duration: { days: 1 },
      },
      dayGridWeek: {
        component: () => renderDayGridView,
        displayEventEnd: false,
      },
      dayGridMonth: {
        component: () => renderDayGridView,
        dayHeaderFormat: { weekday: 'short' },
        dayHeaderAriaLabelFormat: { weekday: 'long' },
        displayEventEnd: false,
        duration: { months: 1 },
        titleFormat: { year: 'numeric', month: 'long' },
      },
    });
  },
};
