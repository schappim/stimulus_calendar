// Per-event visual auto-classes driven by extendedProps.
//
// Phase C5 — confirmationState: 'tentative' | 'confirmed' | 'cancelled'
//   → adds .ec-event-tentative / .ec-event-confirmed / .ec-event-cancelled
//   extendedProps.conflict === true
//   → adds .ec-event-conflict
//
// Phase C6 — extendedProps.rrule (any truthy value)
//   → adds .ec-event-recurring + prepends a small loop glyph inside the
//   chip's first text container.
//
// These are PURELY visual hooks — the host owns the recurring-event
// machinery (RRULE expansion, occurrence handling) and the
// confirmation-state business logic. The calendar only reads the
// extendedProps to surface a class hook.

export function eventMetaClassNames(event) {
  const out = [];
  const cs = event?.extendedProps?.confirmationState;
  if (cs === 'tentative')  out.push('ec-event-tentative');
  if (cs === 'confirmed')  out.push('ec-event-confirmed');
  if (cs === 'cancelled')  out.push('ec-event-cancelled');
  if (event?.extendedProps?.conflict === true) out.push('ec-event-conflict');
  if (event?.extendedProps?.rrule) out.push('ec-event-recurring');
  return out;
}

// Per-event passthrough of arbitrary `data-*` attributes onto the chip
// root. Keys arrive as camelCase (or already-kebab-cased /
// already-`data-`-prefixed) on `extendedProps.dataAttrs`; we
// kebab-case the camelCase form and prefix `data-` so consumers can
// write:
//
//   addEvent({
//     id: 'appt-42',
//     extendedProps: {
//       dataAttrs: { aiContextType: 'job', jobId: 1042 }
//     }
//   })
//
// and the rendered chip carries `data-ai-context-type="job"`
// `data-job-id="1042"`. This is the cheapest hook for downstream tools
// (voice / AI agents, analytics, e2e selectors) that want to target
// tiles by domain shape without going through the calendar API or
// waiting on `eventDidMount` to stamp attributes post-paint.
//
// Values are coerced to strings. `null` / `undefined` values skip the
// attribute entirely (so a falsy `extendedProps.dataAttrs.foo` can
// mean "don't emit"). Object / array values are skipped — there's no
// faithful string serialisation that round-trips, and `data-*` is for
// primitives only.
export function eventMetaDataAttrs(event) {
  const src = event?.extendedProps?.dataAttrs;
  if (!src || typeof src !== 'object') return [];
  const out = [];
  for (const [rawKey, rawVal] of Object.entries(src)) {
    if (rawVal == null) continue;
    if (typeof rawVal === 'object') continue;
    const key = normaliseDataAttrKey(rawKey);
    if (!key) continue;
    out.push([key, String(rawVal)]);
  }
  return out;
}

// Resolve a tile's "type descriptor" from `options.eventTypes` based on
// `event.extendedProps.type`. Returns null when no type is declared on
// the event or no matching entry exists in the map.
//
//   options.eventTypes = {
//     job:         { color: '#f59e0b', classNames: ['ec-event-job'],
//                    label: 'Job', icon: 'wrench' },
//     quote_visit: { color: '#6366f1', classNames: ['ec-event-quote-visit'],
//                    label: 'Quote visit', icon: 'doc' },
//     …
//   }
//
// The returned descriptor is what views consume:
//   - classNames → appended to the chip's class list alongside Phase
//     C5/C6 auto-classes.
//   - color → fallback `--ec-event-color` when the event itself has no
//     `backgroundColor`.
//   - label, icon → exposed for host `eventContent` renderers but not
//     auto-injected (the library doesn't impose chip templates).
//
// We normalise classNames into an array of strings so callers can
// blindly spread the result without branching on shape.
export function resolveEventType(event, options) {
  const type = event?.extendedProps?.type;
  if (!type) return null;
  const map = options?.eventTypes;
  if (!map || typeof map !== 'object') return null;
  const descriptor = map[type];
  if (!descriptor || typeof descriptor !== 'object') return null;
  const declaredClasses = Array.isArray(descriptor.classNames)
    ? descriptor.classNames.filter((c) => typeof c === 'string' && c.length > 0)
    : (typeof descriptor.classNames === 'string' && descriptor.classNames.length > 0
      ? [descriptor.classNames]
      : []);
  // Always include `ec-event-type-{slug}` so hosts can target by type
  // without redeclaring the same class for every entry. The slug is
  // the raw key with non-`[a-z0-9-]` chars replaced with `-` and the
  // result lowercased; that mirrors what a downstream CSS selector
  // would expect.
  const typeSlug = String(type).toLowerCase().replace(/[^a-z0-9-]+/g, '-');
  const autoClass = typeSlug ? `ec-event-type-${typeSlug}` : null;
  const classNames = autoClass
    ? [autoClass, ...declaredClasses.filter((c) => c !== autoClass)]
    : declaredClasses;
  return {
    type,
    color: typeof descriptor.color === 'string' ? descriptor.color : null,
    classNames,
    label: typeof descriptor.label === 'string' ? descriptor.label : null,
    icon: typeof descriptor.icon === 'string' ? descriptor.icon : null,
  };
}

// Convert `aiContextType` → `data-ai-context-type`.
// Pass through `data-ai-context-type` (already prefixed) unchanged.
// Pass through `ai-context-type` (already kebab-cased) with prefix.
// Reject keys with chars HTML wouldn't accept on a data attribute.
function normaliseDataAttrKey(rawKey) {
  if (typeof rawKey !== 'string' || rawKey === '') return null;
  let key = rawKey;
  // camelCase → kebab-case. Only mutate when no '-' is already present
  // so callers passing kebab keys keep them verbatim.
  if (!key.includes('-')) {
    key = key.replace(/([A-Z])/g, '-$1').toLowerCase();
  }
  // Strip a leading hyphen produced by a leading uppercase
  // (e.g. "JobId" → "-job-id" → "job-id").
  if (key.startsWith('-')) key = key.slice(1);
  // Prefix `data-` unless the caller already did.
  if (!key.startsWith('data-')) key = `data-${key}`;
  // Validate the suffix: letters, digits, hyphens only (no spaces,
  // quotes, or equals signs that would corrupt attribute serialisation).
  if (!/^data-[a-z0-9-]+$/i.test(key)) return null;
  return key;
}

// Series introspection — exposes the per-event facts the recurrence-aware
// change hook needs without having to crack open the same extendedProps
// in every consumer.
//
// An event is a "series member" if either:
//   - `extendedProps.rrule` is truthy (the event itself is a recurring
//     master with an RFC 5545 rule), or
//   - `extendedProps.series?.id` is truthy (the event is one occurrence
//     of a host-expanded series, carrying the series id as breadcrumbs
//     so the host can route a per-occurrence edit to the right series
//     master on the server).
//
// `seriesId` returns the explicit id when present, falling back to the
// event's own id (a recurring master uses its own id as the series id).
export function eventMetaSeriesInfo(event) {
  const ep = event?.extendedProps;
  const hasRrule = !!(ep && ep.rrule);
  const explicitId = ep?.series?.id;
  const isSeriesMember = !!(hasRrule || explicitId);
  const seriesId = explicitId ?? (hasRrule ? event?.id ?? null : null);
  return { isSeriesMember, seriesId: seriesId ?? null };
}

// Build a small recurring-badge node ('🔁' fallback for hosts that
// don't ship the loop glyph through their event content). Hosts that
// want richer content (text summary, native FontAwesome) can override
// via options.eventContent.
export function buildRecurringBadge() {
  const span = document.createElement('span');
  span.className = 'ec-event-recurring';
  span.setAttribute('aria-hidden', 'true');
  span.textContent = '🔁';
  return span;
}
