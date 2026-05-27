# Struth integration gaps for stimulus_calendar

Genuine gaps in `stimulus_calendar` for adopting it as the schedule renderer in [Struth](https://github.com/.../struth2) (Rails 8 + Hotwire Native iOS/Android, multi-tenant via `acts_as_tenant`, AI-driven voice/chat overlay, RFC 5545 recurrence with EXDATE + child-override semantics).

Companion to [`schedule-page-feature-gaps.md`](./schedule-page-feature-gaps.md), which covers the broader Roster-lens gap. This file is **only** about hooks Struth needs that the existing plan doesn't already capture.

---

## What I already verified is shipped (don't re-do)

Cross-checked against the actual source + `demo/18-mobile.html` before writing this. The following Struth-shaped concerns are already solved upstream:

- **Long-press-to-drag on touch** — `Interaction` plugin + the mobile demo's `LP_MS = 450` pipeline, edit-mode with corner handles, `LP_MOVE_TOLERANCE` for scroll/swipe disambiguation.
- **Mobile chrome** — safe-area insets, `100dvh`, 44pt touch targets, FAB + bottom-sheet pattern, native datetime-local pickers, `-webkit-touch-callout: none`, capture-phase `dragstart` blocker for iOS HTML5 drag previews, `eventDragMinDistance: 10`, `snapDuration: "00:15:00"`, `slotHeight: 56`, view-switch scrollTime preservation.
- **`timeGrid3Day` view** — declarable inline via `views.timeGrid3Day = { type: "timeGridWeek", duration: { days: 3 }}`. Matches Struth's existing 3-day pane shape.
- **`continuousMonthScroll: true`**, auto-centered NOW indicator on TimeGrid first mount.
- **Auto-classes from `extendedProps`** (Phase C5/C6) — `day_grid.js:162`, `time_grid.js`, etc. Stamps `ec-event-<key>-<value>` classes on the tile root.
- **Recurring badge** — `event.extendedProps.rrule` triggers `buildRecurringBadge()` inside the chip. The library knows an event is part of a series, even though it doesn't expand the rule.
- **`data-event-id`** on every tile root across every view (`day_grid.js:170/296`, `time_grid.js:141/299/337`, `list.js:53`, `resource_time_grid.js:148/180`, `resource_timeline.js:456`).
- **Single static stylesheet** (`src/styles/calendar.css`) — no runtime `<style>` injection from `src/`. The `<style id="status-style">` in demos is host-app code, fine for Struth to skip.
- **Tenant scoping** — `StimulusCalendarRails.tenant_stream_token` reads `ActsAsTenant.current_tenant`, exactly the predicate Struth's `acts_as_tenant :account` produces.
- **`broadcasts_calendar`** concern + `op="add"/"update"/"remove"/"refetch"/"bulk"/"conflict"` Turbo Stream actions.
- **NOW indicator, popovers, `eventPopoverEdit/Delete` events, swipe pager.**

I will not propose changes for any of the above. Earlier drafts of this list were wrong on several of these — apologies.

What follows is only the remaining delta.

---

## Critical (block Struth adoption)

### S1. Recurrence-aware change confirmation

**The gap.** The library already renders a recurring badge when an event has `extendedProps.rrule` (`day_grid.js:185`, `time_grid.js:354`). It does **not** intercept drag/resize/delete on those tiles to ask the host whether the change should apply to this occurrence only, future occurrences, or the whole series. Struth's data model expresses this distinction (master row + `excluded_dates` EXDATE + child Appointments with `recurrence_master_id`); without an upstream hook, every consumer hand-rolls the dialog and gets it subtly wrong.

**Proposed API.**

```js
// Optional async option. Falsy / unset = current behaviour (commit immediately).
confirmEventChange: async (change) => {
  // change = {
  //   kind: "drop" | "resize" | "remove",
  //   event,                  // the event being mutated (Occurrence or master)
  //   delta,                  // for drop/resize: Duration
  //   oldEvent,               // for drop/resize
  //   isOccurrence: boolean,  // true iff event came from a series
  //   seriesId,               // extendedProps.series?.id, if present
  // }
  return { scope: "occurrence" | "future" | "series", proceed: true }
  // proceed: false reverts. scope is passed through to the eventDrop /
  // eventResize / eventRemove event detail so the host PATCH can route
  // it to the right server-side action.
}
```

When unset, the library commits as today (no behaviour change). When set, the library awaits the resolved value before applying the visual commit; on `proceed: false`, animates back. The `scope` field travels on the existing `eventDrop` / `eventResize` event detail.

**Where it lives.** `src/plugins/interaction.js` — wrap the existing commit handlers (`commitTouchDrop`, `commitResize`, …) so they await the option before applying the visual + firing the Stimulus event.

**Demo.** Extend `demo/31-recurring-maintenance.html` with a "this one / this & future / all" sheet.

---

### S2. Series-aware Turbo Stream ops on the gem

**The gap.** `op="update"` and `op="remove"` carry no series semantics. Struth needs to round-trip:

- "Skip this single occurrence" → push the date into the master's `excluded_dates` array (RFC 5545 EXDATE). On the client, the synthetic occurrence at that date disappears; the master stays. Today's `op="remove"` would naively wipe the master.
- "Override this single occurrence" → create a child Appointment with `recurrence_master_id` set, replacing the synthetic occurrence at its date. Today's `op="update"` would patch the master and propagate to every occurrence — wrong.

**Proposed ops.**

```html
<turbo-stream action="calendar-event" op="skip-occurrence"
              target="calendar-schedule">
  <template>{ "seriesId": "appt-42", "date": "2026-06-09" }</template>
</turbo-stream>

<turbo-stream action="calendar-event" op="override-occurrence"
              target="calendar-schedule">
  <template>{
    "seriesId": "appt-42",
    "date": "2026-06-09",
    "overrides": { "title": "Special site visit", "start": "2026-06-09T10:00:00",
                   "end": "2026-06-09T12:00:00" }
  }</template>
</turbo-stream>
```

Client-side: the JS adapter holds a map of synthetic-occurrence ids per series and re-renders only the affected day. The series master and other occurrences are untouched.

**Where it lives.** `gem/stimulus_calendar_rails/lib/.../broadcastable.rb` for the broadcast helpers + `src/lib/broadcast.js` (or wherever the `calendar-event` Turbo Stream action handler lives) for the client routing.

---

### S3. `extendedProps.dataAttrs` passthrough

**The gap.** Struth's voice/chat AI targets schedule tiles by `data-ai-context-type="job|appointment"` + `data-ai-context-id="..."` so it can speak about "this tile" without querying the calendar API. The library auto-stamps classes from `extendedProps` but not arbitrary `data-*` attributes. Today we'd use `eventDidMount` to stamp them — works but repeats per consumer, and `eventDidMount` runs after the initial paint so AI-driven page reads can race.

**Proposed API.**

```js
api.addEvent({
  id: "appt-42",
  start: "2026-06-01T09:00",
  end: "2026-06-01T11:00",
  extendedProps: {
    dataAttrs: {
      aiContextType: "appointment",  // → data-ai-context-type="appointment"
      aiContextId: 42,               // → data-ai-context-id="42"
      jobId: 1042                    // → data-job-id="1042"
    }
  }
})
```

Library kebab-cases the keys and emits each as a `data-*` attribute on the tile root alongside the existing `data-event-id`. Five-line change next to the auto-class emitter in each view.

**Where it lives.** Same call sites as the `extendedProps` auto-class logic — `src/views/day_grid.js:162`, `time_grid.js`, `list.js`, `resource_time_grid.js`, `resource_timeline.js`.

---

### S4. Optimistic update reconciliation (Phase 14, 0.2)

Already on the roadmap (`RAILS.md` §4). Listing it here only to flag it as a Struth blocker, not a new ask — on flaky tradie connections, the drag has to commit visually before the round-trip or the calendar feels unresponsive. Confirm the 0.2 plan covers:

- Client stamps `X-Optimistic-Id` on the PATCH.
- Server replies with `op="confirm"` (no-op on the originator) or `op="revert"` (with validation errors).
- Other clients receive a normal `op="update"`.
- Originator suppresses its own broadcast echo by matching the optimistic id.

If this is on track for 0.2 we're fine; if not, Struth would need to vendor a thin shim. Worth a checkbox in `PLAN.md` linking back here.

---

## Strong improvements (worth landing in lib vs. host)

### S5. `eventTypes` mapping option

**The gap.** Auto-classes-from-extendedProps solves CSS targeting. It doesn't solve label / icon / colour mapping — every consumer (Struth, plumbers, electricians, dispatch) writes the same 30-line callback that maps `extendedProps.type` to a colour and an icon.

**Proposed API.**

```js
api.setOption("eventTypes", {
  job:         { color: "#f59e0b", icon: "wrench",     label: "Job" },
  quote_visit: { color: "#6366f1", icon: "doc",        label: "Quote visit" },
  site_visit:  { color: "#9333ea", icon: "home",       label: "Site visit" },
  meeting:     { color: "#14b8a6", icon: "users",      label: "Meeting" },
  general:     { color: "#64748b", icon: "calendar",   label: "General" },
  service_call:{ color: "#3b82f6", icon: "phone",      label: "Service call" }
})
```

Library reads `event.extendedProps.type` and applies the matching colour/class/aria-label without a callback. Falls back to `event.backgroundColor` when not declared.

**Demo.** New `demo/41-event-types.html` showing the same six chips with and without the option.

---

### S6. Per-resource working hours / availability bands

**The gap.** Resources can have `workingHours: { start, end, weekdays }` (and per-day overrides). The library should render these as background bands automatically on TimeGrid + ResourceTimeline views. Today the TRADIE doc says do it yourself with `display: 'background'` events. Justin works 7am–4pm, Kobe 9am–5pm, neither on Sundays — the dispatch board should show out-of-hours dimmed without the host fabricating one background event per resource per day.

**Proposed API.**

```js
{
  id: "user-12",
  title: "Justin",
  workingHours: {
    daysOfWeek: [1,2,3,4,5,6],        // Mon–Sat
    start: "07:00",
    end: "16:00",
    overrides: { "2026-06-09": { start: "10:00", end: "14:00" } }
  }
}
```

Library renders an `.ec-resource-offhours` band per resource lane outside the declared range; opacity / colour is themable.

**Where it lives.** New module `src/lib/working_hours.js` consumed by `resource_time_grid.js` + `resource_timeline.js`.

---

### S7. Hotwire Native bridge action channel

**The gap.** Inside `eventContent` we put tap-to-call (`tel:`), tap-to-navigate (`maps://`), and open-resource links. In a WebView shell, these should hit the native bridge (CallKit, Maps app, native navigation) rather than firing a WebView navigation. Every Hotwire Native consumer wires the same pattern; the library could ship it.

**Proposed API.**

```js
api.setOption("bridgeActions", true)

el.addEventListener("calendar:bridgeAction", (ev) => {
  // ev.detail = { kind: "tel" | "navigate" | "open", payload, fallbackHref, jsEvent }
  // Host routes through native bridge (or no-op + let fallbackHref fire)
})
```

Inside `eventContent`, host returns `<a data-bridge-action="tel" data-payload="+61...">…</a>`; the library swallows the click and fires `calendar:bridgeAction`. Falls back to standard link behaviour when no listener is attached.

**Demo.** `demo/42-hotwire-native-bridges.html` showing the pattern.

---

### S8. `resource.visible` toggle

**The gap.** Struth accounts include office users (e.g. Tinica) who shouldn't appear as columns on the dispatch board. Today the host filters server-side. A `visible: false` flag on a resource (defaulting `true`) would let the host emit the full roster and toggle per user without a re-fetch.

**Proposed shape.** Add `visible` to the resource schema; default `true`; renderer omits the row when `false`. Pairs cleanly with the existing `expanded` flag for nested groups.

---

### S9. Suppress popover after drag/resize commit

**The gap.** The mobile demo wires four event listeners (`eventDragStop`, `eventDrop`, `eventResizeStop`, `eventResize`) to a `suppressNextPopover` flag because the browser synthesises a `click` after `pointerup` post-gesture, and the calendar's tap-to-open-popover fires on that click. Every consumer hits this — should be handled inside the library.

**Where it lives.** `src/plugins/interaction.js` — set a `gestureJustFinished` flag inside `endDrag` / `endResize`, clear it after a microtask, and have the popover-trigger check it.

---

### S10. Touch-aware `dateClick` gating

**The gap.** The mobile demo carries a 35-line `gestureWasScrollOrSwipe()` helper to filter out `dateClick` events that fired because the user scrolled the time-grid or swiped the pager. The library's Interaction plugin (`interaction.js:723–725`) flips `drag.moved = true` on **any** pointermove, so on touch this fires for every gesture. Most consumers will want this filtered.

**Proposed.** Inside the Interaction plugin, on touch devices, suppress the `dateClick`-with-`end` payload when (a) the time-grid body's `scrollTop` moved during the gesture, (b) the pager is in `ec-pager-dragging` state, or (c) the pointer travelled less than `eventDragMinDistance`. Configurable but on by default for `pointerType === "touch"`.

---

## Nice-to-have

### S11. Date-mode boundary

The mobile demo carries a `calToLocal()` helper because `event.start` / `event.end` are "UTC-mode wall-clock" Dates that need translation to real-local before feeding `<input type="datetime-local">` or the `wallClock()` ISO emitter. This is a known footgun in any non-trivial integration.

**Proposed.** First-class `event.startLocal` / `event.endLocal` getters that return a real-local `Date` regardless of internal representation. The internal representation can stay as-is; this is a boundary helper.

### S12. `eventAppearAnimation`

When Struth's AI streams in a new event server-side, users need a visual cue that something appeared. `eventAppearAnimation: "fly-in" | "highlight-pulse" | "none"` per-event (via `extendedProps`) or per-calendar would let the host emphasise AI-driven creates. Optional polish.

### S13. Default themable conflict UI for `op="conflict"`

The `op="conflict"` Turbo Stream action exists but has no shipped UI — every consumer builds the "server says X, you said Y" modal. A themable default component (slot for the diff renderer, default action buttons "keep mine / use theirs / merge") would land more conflict resolution in practice.

---

## Already covered by `schedule-page-feature-gaps.md` (don't duplicate)

Listed here only so future readers don't think they're missing from this file. These are tracked in the sibling plan; Struth uses them once they land:

- Resource groups (Phase A1) — Struth has staff with role/site/crew metadata that groups well.
- Sticky resource-axis header (A2).
- Empty-cell quick-add affordance + `cellClick` event (A3) — Struth's mobile FAB is a fine fallback; this is dispatch-board polish.
- TODAY column tint + NOW vertical line on Roster (A4).
- Bar resize handles + horizontal drag-to-reschedule on Roster (A5).
- Drag-to-reassign (A6) — Justin → Kobe staff move on the dispatch board.
- `narrow` auto-class (A7).
- `resourceTimelineDayHours` (B1) and `resourceTimelineMonth4w` (B2).
- Pinch-to-zoom row height (B5).

---

## Explicitly out of scope (host-app responsibility, not the library)

- **RRULE expansion.** Server is the source of truth; expanding twice invites drift. The library's current "host expands, library renders, library adds a recurring badge" split is correct.
- **Travel-time bands, map sidecar, capacity heatmap, find-me-a-slot.** Documented in `TRADIE.md` as L1 host-app patterns. They depend on map API keys, geocoding policy, business heuristics — wrong layer for a generic library.
- **Inbound voice/AI tool integration.** The library exposes `api.gotoDate()`, `api.setOption()`, `api.addEvent()`, `api.updateEvent()`, `api.removeEventById()` — enough surface for Struth's AI tools to target client-side without library changes. The discoverability/documentation of this stable API surface is the only ask, not new methods.

---

## Suggested commit ordering

If we tackle these, dependency-ordered:

1. S3 (`dataAttrs`) — five-line change, unblocks AI targeting, no surface risk.
2. S9, S10 (popover + dateClick gating) — bugs more than features, every consumer hits them.
3. S5 (`eventTypes`) — clean addition, no breaking change.
4. S6 (`workingHours`) — biggest dispatch-board win.
5. S1, S2 (recurrence-aware change + series-aware ops) — paired; ship together.
6. S7 (Hotwire Native bridge channel).
7. S8 (`resource.visible`).
8. S4, S11, S12, S13 — polish + Phase-14 dependency.

---

## Status (this branch)

Shipped against `main` in dependency order — every item below landed
with unit + integration tests on the JS side. Search `git log
--oneline plans/struth-integration-gaps.md` for the chain.

- [x] **S3** — `extendedProps.dataAttrs` passthrough (helper +
  five-view wiring).
- [x] **S9** — post-gesture chip-click suppression (capture-phase
  swallow at the calendar root, armed by `*Stop` fire sites in the
  Interaction plugin).
- [x] **S10** — touch-aware `dateClick` gate (suppress when the
  time-grid body scrolled or the pager is mid-swipe).
- [x] **S5** — `eventTypes` mapping option + auto
  `ec-event-type-{slug}` class + color fallback.
- [x] **S6** — per-resource `workingHours` + `.ec-resource-offhours`
  bands in both resource views, themable via
  `--ec-resource-offhours-bg`.
- [x] **S1** — `confirmEventChange` option, `isOccurrence` + `seriesId`
  on every eventDrop/eventResize detail, `calendar:eventChangeConfirmed`
  fired with scope when committed.
- [x] **S2** — series-aware Turbo Stream ops (`skip-occurrence`,
  `override-occurrence`) on both the gem helper and the JS adapter,
  with the latent attribute-hoisting gap in `turbo_stream.js` closed
  as a side-effect (`readCalendarEventStream` now hoists kebab attrs
  to camelCase on the message).
- [x] **S7** — `bridgeActions: true` opt-in + `calendar:bridgeAction`
  channel for tap-to-call / tap-to-navigate / open-resource. Web
  fallback preserved (the link's natural href fires when no
  `preventDefault` is called).
- [x] **S8** — `resource.visible: false` filters the lane / row out
  without a refetch.

Nice-to-haves (also landed in this branch):

- [x] **S11** — `event.startLocal` / `event.endLocal` non-enumerable
  getters that read `start`/`end` live and return real-local Dates,
  so hosts don't have to write `calToLocal()` at every boundary.
- [x] **S12** — `eventAppearAnimation` option + per-event override
  on `extendedProps.appearAnimation`. The controller maintains a
  `_pendingAppearIds` set that the chip renderer reads, with a
  queueMicrotask-scheduled clear so multiple synchronous re-renders
  during one state change all stamp the marker but later renders
  (drag commits, broadcasts) don't re-fire.
- [x] **S13** — Default themable conflict modal triggered by
  `op="conflict"`. Side-by-side server/client diff, three resolutions
  (theirs / mine / dismissed) via button / backdrop click / Escape,
  themable through `ec-conflict-*` class names and the existing CSS
  custom-property palette. `options.conflictRenderer` replaces the
  default when a host wants a custom UI.

Open (deferred — not blockers for Struth adoption):

- [ ] **S4** — optimistic update reconciliation (`op="confirm"` /
  `op="revert"` + `X-Optimistic-Id`). Already tracked in
  `RAILS.md §4` as the 0.2 work; listing here for visibility, not
  re-doing.
