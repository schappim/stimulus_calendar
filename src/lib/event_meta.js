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
