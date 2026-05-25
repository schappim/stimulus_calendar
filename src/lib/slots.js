// Port of calendar/packages/core/src/lib/slots.js (vkurko/calendar v5.7.1).
// Two helpers: createSlots (build the time-axis label list for TimeGrid /
// Timeline views) and createSlotTimeLimits (resolve the effective min/max
// times, optionally expanding to fit out-of-bounds events).

import {
  addDuration, cloneDate, DAY_IN_SECONDS, toISOString, toSeconds,
} from './date.js';
import { createDuration } from './duration.js';
import { max as maxFn, min as minFn, isFunction, floor } from './utils.js';
import { bgEvent } from './events.js';

// Build the time-axis slot list. Returns an array of tuples:
//   [ '<iso slot start>', '<formatted slot label>' ]
// The last slot may carry a 3rd element representing its remaining label
// span when the slot range doesn't divide evenly into slotLabelPeriodicity.
export function createSlots(date, slotDuration, slotLabelPeriodicity, slotTimeLimits, intlSlotLabel) {
  const slots = [];
  date = cloneDate(date);
  const end = cloneDate(date);
  addDuration(date, slotTimeLimits.min);
  addDuration(end, slotTimeLimits.max);

  while (date < end) {
    slots.push([toISOString(date), intlSlotLabel.format(date)]);
    addDuration(date, slotDuration, slotLabelPeriodicity);
  }

  // Last-slot trailing span — fixes a label that visually extends past the
  // end of the axis.
  const span = floor((date - end) / 1000 / toSeconds(slotDuration));
  if (span && span !== slotLabelPeriodicity) {
    slots.at(-1)[2] = slotLabelPeriodicity - span;
  }

  return slots;
}

// Resolve effective slot min/max times. When flexibleSlotTimeLimits is on,
// expand the window outward (up to one DAY_IN_SECONDS in either direction)
// so events that start before min or end after max stay visible. The
// `eventFilter` lets callers exclude (or specifically include) certain
// events from triggering an expansion; default skips background events.
export function createSlotTimeLimits(slotMinTime, slotMaxTime, flexibleSlotTimeLimits, viewDates, filteredEvents) {
  const min = createDuration(slotMinTime);
  const max = createDuration(slotMaxTime);

  if (flexibleSlotTimeLimits) {
    // Extension bounds — minMin/maxMax cap how far we can expand.
    const minMin = createDuration(
      minFn(toSeconds(min), maxFn(0, toSeconds(max) - DAY_IN_SECONDS)),
    );
    const maxMax = createDuration(
      maxFn(toSeconds(max), toSeconds(minMin) + DAY_IN_SECONDS),
    );
    const filter = isFunction(flexibleSlotTimeLimits?.eventFilter)
      ? flexibleSlotTimeLimits.eventFilter
      : (event) => !bgEvent(event.display);

    loop: for (const date of viewDates) {
      const start = addDuration(cloneDate(date), min);
      const end = addDuration(cloneDate(date), max);
      const minStart = addDuration(cloneDate(date), minMin);
      const maxEnd = addDuration(cloneDate(date), maxMax);
      for (const event of filteredEvents) {
        if (!event.allDay && filter(event) && event.start < maxEnd && event.end > minStart) {
          if (event.start < start) {
            const seconds = maxFn((event.start - date) / 1000, toSeconds(minMin));
            if (seconds < toSeconds(min)) {
              min.seconds = seconds;
            }
          }
          if (event.end > end) {
            const seconds = minFn((event.end - date) / 1000, toSeconds(maxMax));
            if (seconds > toSeconds(max)) {
              max.seconds = seconds;
            }
          }
          if (toSeconds(min) === toSeconds(minMin) && toSeconds(max) === toSeconds(maxMax)) {
            break loop;
          }
        }
      }
    }
  }

  return { min, max };
}
