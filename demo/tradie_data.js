// Shared tradie demo data + helpers.
//
// Crews (resources) and jobs (events) modelled the way a ServiceM8/Tradify/
// Fergus-style app would push them into the calendar. All addresses are real
// Sydney suburbs with approximate coordinates so the geography demos
// (travel-time, map, nearby-hint, find-slot) actually produce meaningful
// distances.

// ---------- date helpers ----------------------------------------------------

const pad = (n) => String(n).padStart(2, '0');

// Anchor: today at midnight, in *local* time.
export function today() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

// Wall-clock ISO ("YYYY-MM-DDTHH:mm:00"), no Z — the calendar's no-TZ
// parser treats this as a local instant.
export function wallClock(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
       + `T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
}

export function dayOnly(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// offset days from today, plus hh/mm; returns wall-clock ISO.
export function day(offset, hh = 0, mm = 0) {
  const d = today();
  d.setDate(d.getDate() + offset);
  d.setHours(hh, mm, 0, 0);
  return wallClock(d);
}

export function dayDate(offset) {
  const d = today();
  d.setDate(d.getDate() + offset);
  return dayOnly(d);
}

// ---------- geography -------------------------------------------------------

// Cheap great-circle distance (km). Good enough for tradie demo purposes.
export function distanceKm(a, b) {
  if (!a || !b || a.lat == null || b.lat == null) return null;
  const R = 6371;
  const toRad = (deg) => deg * Math.PI / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s = Math.sin(dLat / 2) ** 2
          + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat))
          * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

// Travel-time estimate (minutes) — assume 32 km/h average around Sydney.
export function travelMins(a, b) {
  const km = distanceKm(a, b);
  if (km == null) return 0;
  return Math.max(5, Math.round((km / 32) * 60));
}

// ---------- status palette --------------------------------------------------

// The five canonical job statuses every tradie app tracks, plus cancelled.
// Colour values are pinned to a single source of truth so every demo agrees.
export const STATUS = {
  quoted:     { label: 'Quoted',      bg: '#fef3c7', fg: '#92400e', border: '#f59e0b' },
  scheduled:  { label: 'Scheduled',   bg: '#dbeafe', fg: '#1e3a8a', border: '#2563eb' },
  inProgress: { label: 'In progress', bg: '#fde68a', fg: '#78350f', border: '#d97706' },
  completed:  { label: 'Completed',   bg: '#dcfce7', fg: '#14532d', border: '#16a34a' },
  invoiced:   { label: 'Invoiced',    bg: '#e0e7ff', fg: '#3730a3', border: '#6366f1' },
  cancelled:  { label: 'Cancelled',   bg: '#f1f5f9', fg: '#64748b', border: '#94a3b8' },
};

export const STATUS_ORDER = [
  'quoted', 'scheduled', 'inProgress', 'completed', 'invoiced',
];

export function nextStatus(s) {
  const i = STATUS_ORDER.indexOf(s);
  if (i < 0 || i === STATUS_ORDER.length - 1) return s;
  return STATUS_ORDER[i + 1];
}

// ---------- crews (resources) ----------------------------------------------

// Five tradies based out of inner Sydney suburbs. workingHours used by the
// capacity heatmap; homeBase used by find-slot + nearby-hint. The "lane"
// colour is whatever the dispatcher recognises that tradie as at a glance.
export const CREWS = [
  {
    id: 'van-1', title: 'Dan — Plumbing',
    eventBackgroundColor: '#0ea5e9',
    extendedProps: {
      role: 'plumber', initials: 'DM',
      homeBase: { lat: -33.886, lng: 151.214, suburb: 'Surry Hills' },
      workingHours: { start: '07:00', end: '16:00' },
    },
  },
  {
    id: 'van-2', title: 'Priya — Electrical',
    eventBackgroundColor: '#a855f7',
    extendedProps: {
      role: 'electrician', initials: 'PK',
      homeBase: { lat: -33.873, lng: 151.207, suburb: 'Darlinghurst' },
      workingHours: { start: '07:30', end: '16:30' },
    },
  },
  {
    id: 'van-3', title: 'Sam — HVAC',
    eventBackgroundColor: '#16a34a',
    extendedProps: {
      role: 'hvac', initials: 'SR',
      homeBase: { lat: -33.918, lng: 151.155, suburb: 'Marrickville' },
      workingHours: { start: '08:00', end: '17:00' },
    },
  },
  {
    id: 'van-4', title: 'Jess — Carpentry',
    eventBackgroundColor: '#f59e0b',
    extendedProps: {
      role: 'carpenter', initials: 'JL',
      homeBase: { lat: -33.892, lng: 151.276, suburb: 'Bondi Junction' },
      workingHours: { start: '07:00', end: '15:30' },
    },
  },
  {
    id: 'van-5', title: 'Marco — Tiling',
    eventBackgroundColor: '#dc2626',
    extendedProps: {
      role: 'tiler', initials: 'MC',
      homeBase: { lat: -33.905, lng: 151.183, suburb: 'Newtown' },
      workingHours: { start: '08:00', end: '16:30' },
    },
  },
];

// ---------- a small bench of customer addresses ----------------------------

export const ADDRESSES = [
  { line1: '12 Crown St',          suburb: 'Surry Hills',     postcode: '2010', lat: -33.884, lng: 151.213 },
  { line1: '88 Oxford St',         suburb: 'Darlinghurst',    postcode: '2010', lat: -33.880, lng: 151.215 },
  { line1: '5 Enmore Rd',          suburb: 'Newtown',         postcode: '2042', lat: -33.897, lng: 151.181 },
  { line1: '210 Marrickville Rd',  suburb: 'Marrickville',    postcode: '2204', lat: -33.911, lng: 151.155 },
  { line1: '14 Hall St',           suburb: 'Bondi Beach',     postcode: '2026', lat: -33.891, lng: 151.276, gateCode: '4137#' },
  { line1: '7 Mackenzie St',       suburb: 'Bondi Junction',  postcode: '2022', lat: -33.892, lng: 151.247 },
  { line1: '3 Pittwater Rd',       suburb: 'Manly',           postcode: '2095', lat: -33.795, lng: 151.288 },
  { line1: '110 King St',          suburb: 'Newtown',         postcode: '2042', lat: -33.896, lng: 151.182 },
  { line1: '62 Glebe Point Rd',    suburb: 'Glebe',           postcode: '2037', lat: -33.875, lng: 151.187, gateCode: 'B12' },
  { line1: '4 Wilson St',          suburb: 'Newtown',         postcode: '2042', lat: -33.894, lng: 151.181 },
  { line1: '25 Belmore Rd',        suburb: 'Randwick',        postcode: '2031', lat: -33.917, lng: 151.247 },
  { line1: '99 Anzac Pde',         suburb: 'Kensington',      postcode: '2033', lat: -33.917, lng: 151.225 },
  { line1: '18 Australia St',      suburb: 'Camperdown',      postcode: '2050', lat: -33.886, lng: 151.176 },
  { line1: '40 Bourke St',         suburb: 'Woolloomooloo',   postcode: '2011', lat: -33.872, lng: 151.218 },
  { line1: '6 Albion St',          suburb: 'Surry Hills',     postcode: '2010', lat: -33.885, lng: 151.211 },
];

// ---------- customers -------------------------------------------------------

export const CUSTOMERS = [
  { name: 'Marcus S.',  phone: '+61 400 111 222' },
  { name: 'Aiyana T.',  phone: '+61 400 333 444' },
  { name: 'Hiro Y.',    phone: '+61 400 555 666' },
  { name: 'Lena K.',    phone: '+61 400 777 888' },
  { name: 'Omar B.',    phone: '+61 400 999 000' },
  { name: 'Sarah W.',   phone: '+61 411 222 333' },
  { name: 'Diego R.',   phone: '+61 411 444 555' },
  { name: 'Nina F.',    phone: '+61 411 666 777' },
  { name: 'Luca P.',    phone: '+61 411 888 999' },
  { name: 'Yusuf E.',   phone: '+61 422 000 111' },
];

// ---------- jobs ------------------------------------------------------------

// A realistic looking week's worth of jobs spread across the crews. Times
// anchored to today() so the demos always look "current".
//
// Convention:
//   id          j-NNNN
//   resourceIds [crewId]
//   start/end   timed (or all-day for site work)
//   extendedProps.{ status, customer, address, durationEst, arrival?, onCall? }
//
// Address/customer indices are kept stable so cross-demo navigation (a job
// shown on the map, then in the run sheet, then in the field view) shows
// the same details everywhere.

export function makeJobs() {
  // Quick helpers so the data table reads cleanly.
  const job = (i, opts) => {
    const addr = ADDRESSES[opts.a];
    const cust = CUSTOMERS[opts.c];
    return {
      id: `j-${1040 + i}`,
      resourceIds: [opts.crew],
      title: opts.title,
      start: day(opts.d, opts.h, opts.m ?? 0),
      end:   day(opts.d, opts.h + Math.floor((opts.dur ?? 60) / 60),
                         (opts.m ?? 0) + (opts.dur ?? 60) % 60),
      extendedProps: {
        jobNumber: `J-${1040 + i}`,
        status: opts.status ?? 'scheduled',
        customer: cust,
        address: addr,
        durationEst: opts.dur ?? 60,
        arrival: opts.arrival,
        onCall: !!opts.onCall,
        notes: opts.notes,
        dependsOn: opts.dependsOn,
        series: opts.series,
      },
    };
  };

  return [
    // ----- Today (day 0) ---------------------------------------------------
    job(1,  { crew: 'van-1', d: 0, h: 7,  m: 30, dur: 90,  title: 'Burst pipe — emergency', status: 'completed',  a: 0,  c: 0 }),
    job(2,  { crew: 'van-1', d: 0, h: 10, m: 0,  dur: 120, title: 'Hot water swap',         status: 'inProgress', a: 4,  c: 1, arrival: { kind: 'window', from: '09:00', to: '11:00' } }),
    job(3,  { crew: 'van-1', d: 0, h: 13, m: 30, dur: 60,  title: 'Tap washers x3',         status: 'scheduled',  a: 8,  c: 2 }),
    job(4,  { crew: 'van-1', d: 0, h: 15, m: 0,  dur: 75,  title: 'Toilet cistern',         status: 'scheduled',  a: 12, c: 3 }),

    job(5,  { crew: 'van-2', d: 0, h: 8,  m: 0,  dur: 90,  title: 'Switchboard upgrade',    status: 'completed',  a: 1,  c: 4 }),
    job(6,  { crew: 'van-2', d: 0, h: 10, m: 30, dur: 60,  title: 'Smoke alarms x4',        status: 'inProgress', a: 13, c: 5 }),
    job(7,  { crew: 'van-2', d: 0, h: 12, m: 30, dur: 120, title: 'Power point relocations',status: 'scheduled',  a: 5,  c: 6 }),
    job(8,  { crew: 'van-2', d: 0, h: 15, m: 30, dur: 60,  title: 'Fault find — no hot water',status: 'scheduled',a: 14, c: 7 }),

    job(9,  { crew: 'van-3', d: 0, h: 8,  m: 30, dur: 120, title: 'Split system install',    status: 'scheduled',  a: 2,  c: 8 }),
    job(10, { crew: 'van-3', d: 0, h: 11, m: 30, dur: 90,  title: 'Ducted service',          status: 'scheduled',  a: 3,  c: 9, arrival: { kind: 'window', from: '11:00', to: '13:00' } }),
    job(11, { crew: 'van-3', d: 0, h: 14, m: 0,  dur: 60,  title: 'Filter clean',            status: 'quoted',     a: 9,  c: 0 }),

    job(12, { crew: 'van-4', d: 0, h: 7,  m: 0,  dur: 480, title: 'Deck framing — day 1',   status: 'inProgress', a: 10, c: 1, notes: 'Multi-day site' }),
    job(13, { crew: 'van-5', d: 0, h: 8,  m: 0,  dur: 240, title: 'Bathroom tiling',         status: 'inProgress', a: 11, c: 2 }),
    job(14, { crew: 'van-5', d: 0, h: 13, m: 0,  dur: 180, title: 'Kitchen splashback',      status: 'scheduled',  a: 6,  c: 3 }),

    // ----- Tomorrow (day 1) ------------------------------------------------
    job(15, { crew: 'van-1', d: 1, h: 8,  m: 0,  dur: 120, title: 'Quarterly maintenance',   status: 'scheduled',  a: 9,  c: 4, series: { id: 'maint-acme', instance: 4 } }),
    job(16, { crew: 'van-1', d: 1, h: 11, m: 0,  dur: 90,  title: 'Roof leak — diagnose',    status: 'scheduled',  a: 5,  c: 5 }),
    job(17, { crew: 'van-2', d: 1, h: 9,  m: 0,  dur: 180, title: 'EV charger install',      status: 'scheduled',  a: 14, c: 6 }),
    job(18, { crew: 'van-2', d: 1, h: 14, m: 0,  dur: 60,  title: 'LED downlights',          status: 'scheduled',  a: 13, c: 7 }),
    job(19, { crew: 'van-3', d: 1, h: 10, m: 0,  dur: 90,  title: 'Refrigerant top-up',      status: 'quoted',     a: 3,  c: 8 }),
    job(20, { crew: 'van-4', d: 1, h: 7,  m: 0,  dur: 480, title: 'Deck framing — day 2',    status: 'scheduled',  a: 10, c: 1, notes: 'Multi-day site' }),
    job(21, { crew: 'van-5', d: 1, h: 9,  m: 0,  dur: 240, title: 'Bathroom tiling — finish',status: 'scheduled',  a: 11, c: 2, dependsOn: ['j-1053'] }),

    // ----- Day after tomorrow (day 2) --------------------------------------
    job(22, { crew: 'van-1', d: 2, h: 8,  m: 0,  dur: 120, title: 'Backflow test',           status: 'scheduled',  a: 12, c: 9 }),
    job(23, { crew: 'van-2', d: 2, h: 9,  m: 0,  dur: 180, title: 'Solar inverter swap',     status: 'scheduled',  a: 6,  c: 0 }),
    job(24, { crew: 'van-3', d: 2, h: 10, m: 0,  dur: 120, title: 'Heat pump diagnostic',    status: 'scheduled',  a: 2,  c: 1 }),
    job(25, { crew: 'van-4', d: 2, h: 7,  m: 0,  dur: 480, title: 'Deck framing — day 3',    status: 'scheduled',  a: 10, c: 1, notes: 'Multi-day site' }),

    // ----- After-hours / on-call (today night) -----------------------------
    job(26, { crew: 'van-1', d: 0, h: 19, m: 0,  dur: 90,  title: 'After-hours: leak',      status: 'quoted',     a: 7,  c: 3, onCall: true }),
  ];
}

// ---------- helpers consumed by demos --------------------------------------

// Build the className for a given event based on its status. Demos drop a
// matching CSS block into their <style>; the convention is `job-status-XXXX`.
export function statusClass({ event }) {
  const s = event.extendedProps?.status;
  if (!s) return [];
  return ['job', `job-status-${s}`];
}

// A single CSS block that all status-aware demos can drop into <style>.
// Returns a string so callers can interpolate via template literals.
export function statusCss() {
  return Object.entries(STATUS).map(([k, v]) => `
    .ec-event.job-status-${k} {
      background: ${v.bg} !important;
      color: ${v.fg} !important;
      border-left: 4px solid ${v.border} !important;
    }
    .job-status-pill.job-status-${k} {
      background: ${v.bg};
      color: ${v.fg};
      border: 1px solid ${v.border};
    }`).join('\n');
}
