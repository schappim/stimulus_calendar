// Port of calendar/packages/core/src/lib/view.js (vkurko/calendar v5.7.1).
// A View describes one rendered display window — its type (view name), title
// (formatted by titleFormat), and two ranges: currentRange is what the user
// asked for (e.g. May 2026), activeRange is what's actually drawn (e.g.
// from the prior Sunday to the next Saturday, so the month grid is full).
// `calendar` is the API handle and is set by the controller after construction.

import { assign } from './utils.js';
import { toLocalDate } from './date.js';

export function createView(view, viewTitle, currentRange, activeRange) {
  return {
    type: view,
    title: viewTitle,
    currentStart: currentRange.start,
    currentEnd: currentRange.end,
    activeStart: activeRange.start,
    activeEnd: activeRange.end,
    calendar: undefined,
  };
}

// Clone a view into the public-API shape: every Date is the local-tz version.
export function toViewWithLocalDates(view) {
  view = assign({}, view);
  view.currentStart = toLocalDate(view.currentStart);
  view.currentEnd = toLocalDate(view.currentEnd);
  view.activeStart = toLocalDate(view.activeStart);
  view.activeEnd = toLocalDate(view.activeEnd);
  return view;
}
