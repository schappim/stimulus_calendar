// Deterministic per-day weather forecast used by the forecast demo.
//
// Same ISO date always returns the same forecast — derived from a 32-bit
// FNV-1a hash of the date string fed into a small xorshift PRNG. That
// keeps the calendar reproducible across reloads, across browsers, and
// across the multiple views on the same page (so the "Tuesday" tile and
// the "Tuesday" column header always agree).
//
// Real apps would swap this for an actual weather API call keyed off the
// active date range — the surface (`getForecast(date)` → `{ id, label,
// highC, lowC, precipMm, windKmh, icon }`) is the integration seam.

const CONDITIONS = [
  { id: 'sunny',         label: 'Sunny',         high: [22, 32], low: [12, 22], precip: 0,  wind: 8  },
  { id: 'partly-cloudy', label: 'Partly cloudy', high: [18, 28], low: [10, 20], precip: 0,  wind: 12 },
  { id: 'cloudy',        label: 'Cloudy',        high: [14, 22], low: [8, 16],  precip: 1,  wind: 14 },
  { id: 'rain',          label: 'Light rain',    high: [10, 18], low: [6, 14],  precip: 6,  wind: 18 },
  { id: 'heavy-rain',    label: 'Heavy rain',    high: [8, 15],  low: [4, 12],  precip: 22, wind: 24 },
  { id: 'thunderstorm',  label: 'Thunderstorm',  high: [15, 24], low: [10, 18], precip: 16, wind: 32 },
  { id: 'snow',          label: 'Snow',          high: [-2, 4],  low: [-8, -2], precip: 12, wind: 14 },
  { id: 'fog',           label: 'Fog',           high: [4, 12],  low: [0, 8],   precip: 0,  wind: 6  },
];

// Fair weather is more common than dramatic weather; the weights bias the
// roll so a 30-day calendar still shows the occasional storm/snow tile
// instead of an evenly-distributed sample.
const WEIGHTS = [3, 4, 3, 2, 1, 1, 1, 1];

function hashISO(iso) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < iso.length; ++i) {
    h ^= iso.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed) {
  let s = seed | 0;
  return () => {
    s = Math.imul(s ^ (s >>> 15), 2246822507);
    s = Math.imul(s ^ (s >>> 13), 3266489909);
    s ^= s >>> 16;
    return (s >>> 0) / 0xffffffff;
  };
}

function pickInRange([lo, hi], r) {
  return Math.round(lo + (hi - lo) * r());
}

function toISO(date) {
  if (date instanceof Date) return date.toISOString().substring(0, 10);
  return String(date).substring(0, 10);
}

export function getForecast(date) {
  const iso = toISO(date);
  const r = rng(hashISO(iso));
  const total = WEIGHTS.reduce((a, b) => a + b, 0);
  let pick = r() * total;
  let idx = 0;
  for (let i = 0; i < WEIGHTS.length; ++i) {
    if (pick < WEIGHTS[i]) { idx = i; break; }
    pick -= WEIGHTS[i];
  }
  const cond = CONDITIONS[idx];
  const high = pickInRange(cond.high, r);
  // Floor the low so it's always at least 2°C below the high — otherwise
  // a hot day can roll high=22/low=22 which reads as broken.
  const lowMax = Math.min(cond.low[1], high - 2);
  const low = pickInRange([cond.low[0], lowMax], r);
  return {
    date: iso,
    id: cond.id,
    label: cond.label,
    highC: high,
    lowC: low,
    precipMm: cond.precip,
    windKmh: Math.max(0, cond.wind + Math.round(r() * 8) - 4),
    icon: ICONS[cond.id],
  };
}

export function getForecasts(start, end) {
  const out = [];
  const d = new Date(start);
  const stop = new Date(end);
  while (d < stop) {
    out.push(getForecast(d));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
}

// 24×24 inline SVGs, no external deps. Each marker class lets the demo
// CSS tint the icon (so a "rain" badge can pick up a blue accent).
export const ICONS = {
  'sunny': `<svg viewBox="0 0 24 24" class="ec-weather-icon ec-weather-sunny" aria-hidden="true">
    <circle cx="12" cy="12" r="4" fill="#fbbf24"/>
    <g stroke="#fbbf24" stroke-width="2" stroke-linecap="round">
      <line x1="12" y1="2"  x2="12" y2="5"/>
      <line x1="12" y1="19" x2="12" y2="22"/>
      <line x1="2"  y1="12" x2="5"  y2="12"/>
      <line x1="19" y1="12" x2="22" y2="12"/>
      <line x1="4.5" y1="4.5"  x2="6.6" y2="6.6"/>
      <line x1="17.4" y1="17.4" x2="19.5" y2="19.5"/>
      <line x1="4.5" y1="19.5" x2="6.6" y2="17.4"/>
      <line x1="17.4" y1="6.6" x2="19.5" y2="4.5"/>
    </g>
  </svg>`,
  'partly-cloudy': `<svg viewBox="0 0 24 24" class="ec-weather-icon ec-weather-partly" aria-hidden="true">
    <circle cx="8" cy="8" r="3.5" fill="#fbbf24"/>
    <path d="M9 14a4 4 0 0 1 7.5-1.2A3.5 3.5 0 1 1 17 20H8a3 3 0 0 1 1-6z" fill="#cbd5e1"/>
  </svg>`,
  'cloudy': `<svg viewBox="0 0 24 24" class="ec-weather-icon ec-weather-cloudy" aria-hidden="true">
    <path d="M6 16a3 3 0 1 1 .6-5.94A5 5 0 0 1 16.5 10 4 4 0 0 1 18 18H7a3 3 0 0 1-1-2z" fill="#94a3b8"/>
  </svg>`,
  'rain': `<svg viewBox="0 0 24 24" class="ec-weather-icon ec-weather-rain" aria-hidden="true">
    <path d="M6 12a3 3 0 1 1 .6-5.94A5 5 0 0 1 16.5 6 4 4 0 0 1 18 14H7a3 3 0 0 1-1-2z" fill="#64748b"/>
    <g stroke="#3b82f6" stroke-width="2" stroke-linecap="round">
      <line x1="8"  y1="17" x2="7"  y2="20"/>
      <line x1="12" y1="17" x2="11" y2="20"/>
      <line x1="16" y1="17" x2="15" y2="20"/>
    </g>
  </svg>`,
  'heavy-rain': `<svg viewBox="0 0 24 24" class="ec-weather-icon ec-weather-heavy-rain" aria-hidden="true">
    <path d="M6 11a3 3 0 1 1 .6-5.94A5 5 0 0 1 16.5 5 4 4 0 0 1 18 13H7a3 3 0 0 1-1-2z" fill="#475569"/>
    <g stroke="#2563eb" stroke-width="2" stroke-linecap="round">
      <line x1="7"  y1="15" x2="5"  y2="19"/>
      <line x1="11" y1="15" x2="9"  y2="19"/>
      <line x1="15" y1="15" x2="13" y2="19"/>
      <line x1="19" y1="15" x2="17" y2="19"/>
    </g>
  </svg>`,
  'thunderstorm': `<svg viewBox="0 0 24 24" class="ec-weather-icon ec-weather-thunder" aria-hidden="true">
    <path d="M6 11a3 3 0 1 1 .6-5.94A5 5 0 0 1 16.5 5 4 4 0 0 1 18 13H7a3 3 0 0 1-1-2z" fill="#475569"/>
    <path d="M12 14l-3 5h2l-1 4 4-6h-2l1-3z" fill="#fbbf24"/>
  </svg>`,
  'snow': `<svg viewBox="0 0 24 24" class="ec-weather-icon ec-weather-snow" aria-hidden="true">
    <path d="M6 11a3 3 0 1 1 .6-5.94A5 5 0 0 1 16.5 5 4 4 0 0 1 18 13H7a3 3 0 0 1-1-2z" fill="#cbd5e1"/>
    <g fill="#0ea5e9">
      <circle cx="8"  cy="18" r="1.2"/>
      <circle cx="12" cy="20" r="1.2"/>
      <circle cx="16" cy="18" r="1.2"/>
    </g>
  </svg>`,
  'fog': `<svg viewBox="0 0 24 24" class="ec-weather-icon ec-weather-fog" aria-hidden="true">
    <g stroke="#94a3b8" stroke-width="2" stroke-linecap="round">
      <line x1="4"  y1="9"  x2="20" y2="9"/>
      <line x1="3"  y1="13" x2="21" y2="13"/>
      <line x1="5"  y1="17" x2="19" y2="17"/>
    </g>
  </svg>`,
};
