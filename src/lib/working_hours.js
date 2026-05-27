// Per-resource working hours.
//
// Resources can carry a `workingHours` descriptor that names the
// recurring weekly availability of a person, room, or vehicle. The
// renderer paints a translucent off-hours band outside the declared
// range on TimeGrid + ResourceTimeline lanes so dispatchers can see at
// a glance when a resource is unavailable, and so jobs that land on
// off-hours visually pop.
//
// Shape:
//
//   {
//     id: 'user-12',
//     title: 'Justin',
//     workingHours: {
//       daysOfWeek: [1, 2, 3, 4, 5, 6],   // Mon–Sat (0 = Sunday)
//       start: '07:00',                   // "HH:MM"
//       end:   '16:00',
//       overrides: {
//         '2026-06-09': { start: '10:00', end: '14:00' },  // late start
//         '2026-06-10': null,                              // off entire day
//       },
//     },
//   }
//
// `overrides[dateStr]` takes priority over `daysOfWeek`. A `null`
// override means the resource is off that whole date (e.g. annual
// leave). An override with `{ start, end }` replaces the default
// times for that single date.
//
// All helpers below speak minutes-from-midnight so the renderers
// can multiply by their own px-per-minute factor without re-parsing.

const MIN_PER_DAY = 1440;

// Parse "HH:MM" → minutes from midnight. Returns null on invalid input.
function parseHHMM(s) {
  if (typeof s !== 'string') return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(s.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const mm = Number(m[2]);
  if (h < 0 || h > 24 || mm < 0 || mm > 59) return null;
  return h * 60 + mm;
}

// ISO YYYY-MM-DD for a Date in its calendar-local components.
// We treat the input Date as already-local (callers either construct
// it from local fields or feed in a UTC-mode wall-clock Date — both
// work because we only read the date components, never the offset).
function isoDate(date) {
  const y = date.getFullYear ? date.getFullYear() : NaN;
  if (Number.isNaN(y)) return null;
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// For a given working-hours descriptor + date, returns either the
// {startMin, endMin} window the resource is ON, or `null` when the
// resource is OFF for the entire day.
//
// Returns `null` for null/missing descriptors (caller decides whether
// "no schedule declared" means "available all day" or "available never"
// — the library's view side treats it as "available all day", i.e.
// no off-hours band).
export function workingWindowForDate(workingHours, date) {
  if (!workingHours || typeof workingHours !== 'object') return null;
  if (!date) return null;

  // Override branch — applies before the day-of-week test.
  const overrides = workingHours.overrides;
  if (overrides && typeof overrides === 'object') {
    const key = isoDate(date);
    if (key && Object.prototype.hasOwnProperty.call(overrides, key)) {
      const override = overrides[key];
      if (override === null) return { startMin: 0, endMin: 0 };
      if (override && typeof override === 'object') {
        const s = parseHHMM(override.start);
        const e = parseHHMM(override.end);
        if (s != null && e != null && e > s) return { startMin: s, endMin: e };
        return { startMin: 0, endMin: 0 };
      }
    }
  }

  // Recurring branch — daysOfWeek check.
  const dow = date.getDay ? date.getDay() : null;
  const daysOfWeek = workingHours.daysOfWeek;
  if (Array.isArray(daysOfWeek) && dow != null && !daysOfWeek.includes(dow)) {
    return { startMin: 0, endMin: 0 };
  }

  // Default times.
  const s = parseHHMM(workingHours.start);
  const e = parseHHMM(workingHours.end);
  if (s == null || e == null || e <= s) return { startMin: 0, endMin: 0 };
  return { startMin: s, endMin: e };
}

// For a given working-hours descriptor + date, returns the off-hours
// intervals as an array of {startMin, endMin} pairs. The list is
// always sorted by startMin and never overlapping.
//
//   Off all day:               [{ startMin: 0, endMin: 1440 }]
//   On 9-17:                   [{ 0..540 }, { 1020..1440 }]
//   On 9-17 with no end gap:   [{ 0..540 }]      (if endMin === 1440)
//   On 0-24:                   []                (no off-hours)
//
// Returns an empty array when no descriptor is provided — i.e. the
// caller should treat "no working hours declared" as "available all
// day", paint no off-hours band.
export function offHoursIntervalsForDate(workingHours, date) {
  const window = workingWindowForDate(workingHours, date);
  if (window == null) return [];           // no descriptor → no off-hours
  const { startMin, endMin } = window;
  // Closed all day.
  if (startMin === endMin) return [{ startMin: 0, endMin: MIN_PER_DAY }];
  const out = [];
  if (startMin > 0) out.push({ startMin: 0, endMin: startMin });
  if (endMin < MIN_PER_DAY) out.push({ startMin: endMin, endMin: MIN_PER_DAY });
  return out;
}
