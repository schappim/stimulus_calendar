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
