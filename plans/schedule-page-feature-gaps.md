# Schedule-page mockup vs. stimulus_calendar — feature-gap plan

Source mockup: `struth2/competitor-app-research/_mvp/resources/schedule-page-gaps-mockup-interactive.html`

The mockup is the tradie SaaS's Schedule screen at full fidelity — Day / Week /
Month / Roster lenses, scheduling-X mode, role variants, and every supporting
sheet / popover. This plan filters it down to **what the embedded calendar
component must do**, ignores everything the host app handles, and lays out the
work in order of dependency.

The current codebase (Phases 0–18 of `PLAN.md`) is a 100 %-feature port of
vkurko/calendar plus a Rails companion gem. It already covers:

- `dayGridDay / dayGridWeek / dayGridMonth` + continuous-month scroll
- `timeGridDay / timeGridWeek` with all-day row, live NOW indicator (ticks on
  `state.now`), overlap lanes, drag + end-resize
- `listDay / listWeek / listMonth / listYear`
- `resourceTimeGridDay / resourceTimeGridWeek`
- `resourceTimelineDay / Week / Month / Year` with nested resources
- Interaction plugin: pointer drag, end-resize, double-click popover,
  cross-day edge-hold pager step
- Event popover (macOS-style stacked cards) with directional tail
- Broadcast bus (Turbo Stream / ActionCable / WebSocket / BroadcastChannel)

Scope boundary for this plan: only changes to **`src/`** of
`stimulus_calendar` (controller, views, components, plugins, styles). Anything
that belongs to the host Rails app — sheets, AI tools, AppointmentType /
ConfirmationState business rules, smart-slot suggestions, navigation chrome,
permissions, persistence — is called out at the bottom as out of scope.

---

## 1. Lens × zoom matrix the mockup demands

The mockup formalises a **3 × 3 view matrix** (lens × time scale). Each cell is
a view name and a renderer:

| | Day zoom | Week zoom | Month zoom |
|---|---|---|---|
| **Calendar lens** | Single-day timeline (§4) | 7-day × 24h grid (§4b) | Outlook 6×7 grid (§4c) |
| **People lens** (Roster) | People × hour grid (§roster-dispatch) | People × week grid (§roster) | People × 4-week Gantt (§4d people-month) |
| **Projects lens** (Roster) | Projects × hour grid (rare) | Projects × week grid (§roster projects) | Projects × 4-week Gantt (§4d projects-month) |

Of those 9 cells, the existing port covers **3 cleanly** and **1 partially**:

- ✅ Calendar × Day → `timeGridDay`
- ✅ Calendar × Week → `timeGridWeek`
- ✅ Calendar × Month → `dayGridMonth` (+ `continuousMonthScroll`)
- 🟡 People/Projects × Week → `resourceTimelineWeek` (missing crew grouping,
  drag-to-reassign, empty-cell affordance, sticky day-header, NOW vertical line,
  bar resize handles, "narrow" auto-class, tentative/conflict states)
- ❌ People/Projects × Day (hour-column Gantt with crew grouping) — no view
- ❌ People/Projects × Month (4-week compressed Gantt with week markers) — no view

The Roster view is the dominant gap. Everything else is polish.

---

## 2. Required features, grouped by phase

The phases are dependency-ordered: each phase ships a coherent slice, and later
phases build on the primitives the earlier ones introduce.

### Phase A — Roster view primitives (the biggest gap)

These primitives unlock the People/Projects lens × any zoom. They're additive
to `resourceTimeline.js`; the existing nested-resource expander stays.

- **A1 · Resource groups.** First-class concept above resources: a group has an
  `id`, `title`, `color`, `expanded`, ordered `resourceIds`. New options
  `resourceGroups: [{ id, title, color, resourceIds, expanded }]` and
  `resourceGroupField` (when groups should be derived from a resource property
  like `crewId`). Renderers gain a group-header row with chevron, swatch,
  member count, and right-side action slot (for an "Edit" link the host wires).
  Tap on the chevron toggles the descendants' visibility (CSS sibling
  selector). Resources without a group render as flat siblings — no
  "Unaffiliated" header.
  - New API: `calendarApi.setGroupExpanded(groupId, expanded)`,
    `calendarApi.getGroupExpanded(groupId)`.
  - New event: `groupExpand` / `groupCollapse` with `{ groupId, view }`.
  - New theme keys: `groupHeader`, `groupHeaderSwatch`, `groupHeaderName`,
    `groupHeaderCount`, `groupHeaderAction`.

- **A2 · Sticky resource-axis header.** ResourceTimeline today renders the day
  labels in a non-sticky `data-row="header"`. Make it `position: sticky;
  top: 0; z-index: 3` and ensure the row-head spacer's width matches the body
  rows. New theme key `colHeadSticky` + CSS rule.

- **A3 · Empty-cell quick-add affordance.** Every day-cell in the strip becomes
  a tap target. Hover/focus reveals a centred `＋` glyph. Tap fires
  `cellClick` (date + resource derived from cell), distinct from the existing
  `dateClick` (which fires from the underlying calendar background). New
  options: `emptyCellAddButton: false | true | (ctx) => htmlOrText`,
  `cellClick: ({ date, resource, group, jsEvent }) => …`. Host can use this
  to open the "new appointment" sheet pre-filled.

- **A4 · TODAY column tint + NOW vertical line through all rows.** Today's
  column already gets `.ec-day-head-today`; extend to a column tint that
  paints down through every row's strip (CSS `::before` on the body's grid
  column, or absolute-positioned `.ec-today-band` spanning row 1 → row N).
  NOW line is a vertical 2 px red rule positioned at
  `(now − rangeStart) / rangeSeconds` of the strip width, subscribed to
  `state.now` so it ticks every second without re-rendering. Suppressed unless
  `options.nowIndicator` is true (same flag TimeGrid uses).

- **A5 · Bar resize handles + horizontal drag-to-reschedule.** Today the
  Interaction plugin only handles TimeGrid resize. Port the same engine to
  ResourceTimeline ribbon bars: render `data-resizer="start"` and
  `data-resizer="end"` chips inside the bar, only when `options.editable` and
  `eventDurationEditable` are on (with `eventResizableFromStart` gating the
  start handle, matching upstream). Pointer-drag on the bar body translates X
  → days; on pointerup, commit via `calendarApi.updateEvent` so it flows
  through the existing broadcast pipeline.

- **A6 · Drag-to-reassign (drop bar on a different row's strip).** During a
  bar drag, hit-test pointer Y against the row layout; if dropped on a
  different resource row, the commit payload includes the new `resourceIds`.
  Fires the existing `eventDrop` with `{ event, oldEvent, delta,
  oldResource, newResource, revert }`. No new API — just extra fields on the
  existing payload. Required for the "drag Will's job onto Mike's row to
  reassign" flow.

- **A7 · `narrow` auto-class on bars.** Measure rendered bar width on layout;
  if below `options.eventNarrowThreshold` (default 60 px) add an
  `ec-event-narrow` class so per-bar CSS can hide meta. Subscribed via
  `ResizeObserver` so columns reflowing during pinch-to-zoom keeps the class
  current.

### Phase B — Roster view zoom modes (Day and Month)

These add hour-column and 28-day-column rendering on top of the Phase A
primitives. They reuse the same DOM shape; only the column-template changes.

- **B1 · `resourceTimelineDayHours` view (or
  `resourceTimelineDay` + `slotMode: 'hours'`).** Renders 12 hour-columns
  (default 6 AM → 6 PM, configurable via `slotMinTime` / `slotMaxTime`).
  Bars size in hour-fractions. Each row's strip is `grid-template-columns:
  repeat(N, 1fr)` where N is the hour count. Live NOW vertical line moves
  with `state.now`. Lunch-shade decoration is a CSS `::before` keyed on a
  configurable `lunchHour` option (no rendered DOM cost when off).

- **B2 · `resourceTimelineMonth4w` view (or
  `resourceTimelineMonth` + `slotMode: 'days'` + `weeks: 4`).** Renders
  28 day-columns with week-start dividers (every 7th column gets a thicker
  border) and a week-label row above (`Wk 20 · May 12`, …). The bar's `narrow`
  class kicks in for most bars at this density. Day-column today highlight is
  a 16 px filled blue circle on the day number (matches iOS Calendar
  pattern — see B6).

- **B3 · `slotMode` option.** New option that picks between `days` (existing
  behaviour) and `hours` for ResourceTimeline. Documented; defaults preserve
  existing behaviour.

- **B4 · Sticky column-header in zoom-day.** Hour labels in the header sticky-
  top; row-strips scroll under them.

- **B5 · Pinch-to-zoom row height.** Two-finger pinch on the body toggles
  between `compactRowHeight` (52 px) and `comfyRowHeight` (88 px). Both are
  options; the gesture fires `rowHeightChange` with the new height. No-op on
  desktop / when `options.allowPinchZoom` is false.

- **B6 · Today-circle dayHead variant.** Add an option
  `dayHeaderTodayStyle: 'cell-tint' | 'circle'` (default `cell-tint` to
  preserve existing look). When `circle`, the today's day-number gets wrapped
  in a 24 px filled accent circle (iOS Calendar). Affects DayGrid, TimeGrid,
  ResourceTimeline, ResourceTimeGrid.

### Phase C — Calendar lens polish to match the mockup pixel-for-pixel

- **C1 · Continuous-week scroll for TimeGrid.** Analogous to
  `continuousMonthScroll` in DayGrid month. Adds a horizontal pager so swipe-
  left/right flips to the adjacent week without explicit prev/next clicks.
  Implemented as `src/components/week_scroller.js` mirroring `month_scroller.js`.
  Opt-in via `continuousWeekScroll: true`. Same view-date memory hook the
  controller already uses for MonthScroller's destroy-flush pattern.

- **C2 · Density dots on dayHeader.** Option `dayHeaderDensity: false | true |
  (count) => htmlOrText`. When true, renders up to 3 small dots under the
  weekday/date label in the column header, where dot count = event count
  capped at 3. Used in the mockup's week-strip (Day view top) AND week
  view's `wk-grid-head .col-h`.

- **C3 · Stripe-only chips in DayGrid Month cells.** Today's chip in dayGrid
  has a leading dot + time + title. The mockup's Month-view cell uses pure
  colour stripes (no dot, no time, title only). Add
  `dayCellEventStyle: 'chip' | 'stripe'` (default `chip`). When `stripe`,
  events render as full-width colour bars with title only. Drives
  `.appt-tile` colour-by-type visually in Month view.

- **C4 · Avatar-stack content recipe.** No new API — document a
  copy-paste `eventContent` recipe in `docs/REFERENCE.md` that renders the
  title + a stack of small avatar circles (matches the Day view tile's
  `.avatars .av wk`). Avatar data comes from event's `extendedProps.staff`.

- **C5 · Per-event confirmation-state styling.** When an event carries
  `extendedProps.confirmationState`, the view automatically adds one of
  `ec-event-tentative` / `ec-event-confirmed` / `ec-event-cancelled` classes,
  and `extendedProps.conflict === true` adds `ec-event-conflict`. Default
  CSS for `tentative` = dashed border + 50 % opacity, `conflict` = 2 px red
  outline. Host can override via `eventClassNames`.

- **C6 · Per-event recurring badge.** When event carries `extendedProps.rrule`,
  the view appends a small `🔁` glyph and shows the human-readable summary
  on a second line (matches `.appt-tile.recurring` mockup). New helper
  `lib/rrule_summary.js` (uses `Intl.PluralRules` for "every Tue" style
  output — no rrule.js dependency, just a small subset of FREQ/BYDAY).

### Phase D — Mode plumbing for scheduling-X

This is the smallest phase. Scheduling-X in the mockup is "not a new view, it's
a mode that wraps any of the 9 cells in the matrix." The calendar needs three
things to support it:

- **D1 · Calendar mode flag.**
  `calendarApi.setMode(name, context?)` / `calendarApi.clearMode()` /
  `calendarApi.getMode()`. Adds/removes `data-calendar-mode="<name>"` on the
  root element. CSS can then key off `[data-calendar-mode="scheduling-x"]`.
  Fires `modeChange` event.

- **D2 · Mode-aware empty-cell affordance.** When a mode is active and the
  host has passed `cellAffordanceWhen: (mode) => boolean`, every empty cell
  gets the dashed-orange affordance (CSS already), and `cellClick` becomes
  the primary tap action even where `eventClick` would normally win.

- **D3 · Suggested-slot prop.** `calendarApi.setSuggestedSlot({ start, end,
  resourceId })` paints a stripe/pulse on that slot. Re-fires on view changes
  so the host doesn't have to re-call after each navigation. Renders inside
  the empty-cell layer (TimeGrid, ResourceTimeline). Fires `suggestedSlotClick`
  when tapped.

### Phase E — Off-period state + back-to-today

Tiny, but the mockup hangs a floating "↩ Back to today" pill on every off-
period frame. The calendar can expose the state and let the host render the
pill, OR ship a built-in option.

- **E1 · `isOffPeriod()` getter on the API.** Returns `true` when the active
  range doesn't cover `state.now`. Fires `offPeriodChange` whenever it flips.

- **E2 · Built-in `backToTodayPill: true` option.** Renders the pill inside
  the calendar root when off-period, anchored bottom-centre, animated in.
  Tap dispatches `today()`. Opt-in so host apps that own their own UI can
  ignore it.

### Phase F — Range-select (close out the Phase 18 deferral)

The mockup doesn't really need this for the Schedule page, but tap-drag-to-
create-an-event is half-built (option declared but no pipeline). Closing it
out unlocks "drag across cells to pre-fill duration" in `sheet:new-appointment`.

- **F1 · Pointer range-select pipeline.** Wire `selectable: true` with
  pointerdown-on-empty-cell + pointermove → highlight cells / time-range +
  pointerup → fire `select` with `{ start, end, allDay, resource, jsEvent,
  view }`. Honours `selectMinDistance`, `selectLongPressDelay`,
  `selectBackgroundColor`, `selectConstraint`. Background-deselect already
  works.

---

## 3. Recommended new public-API surface

Aggregated from the phases above so consumers can see the whole shape:

```js
// Resource grouping (Phase A1)
resourceGroups: [
  { id: 'crew-a', title: 'Crew A', color: '#5856d6',
    resourceIds: ['will', 'mike'], expanded: true },
],
resourceGroupField: 'crewId',          // OR: derive groups from resource prop

// Empty-cell affordance (Phase A3)
emptyCellAddButton: true,              // or (ctx) => ({ html: '…' })
cellClick: ({ date, resource, group, jsEvent, view }) => {…},

// Bar narrowness (Phase A7)
eventNarrowThreshold: 60,              // px

// Roster zoom modes (Phase B)
slotMode: 'days' | 'hours',            // ResourceTimeline only
lunchHour: 12,                         // 0–23 or null
allowPinchZoom: true,
compactRowHeight: 52,
comfyRowHeight: 88,

// Visual variants (Phase B6, C3, C5)
dayHeaderTodayStyle: 'cell-tint' | 'circle',
dayCellEventStyle: 'chip' | 'stripe',
// (no new opts for tentative/conflict/recurring — driven by event.extendedProps)

// Continuous-week pager (Phase C1)
continuousWeekScroll: true,

// Density dots (Phase C2)
dayHeaderDensity: true,                // or (count) => htmlOrText

// Mode plumbing (Phase D)
calendarApi.setMode(name, context?)
calendarApi.clearMode()
calendarApi.getMode()
calendarApi.setSuggestedSlot({ start, end, resourceId })
calendarApi.clearSuggestedSlot()
cellAffordanceWhen: (mode) => boolean,

// Off-period (Phase E)
calendarApi.isOffPeriod()
backToTodayPill: true,

// Selection (Phase F)
selectable: true,
select / unselect / selectMinDistance / selectLongPressDelay /
selectBackgroundColor / selectConstraint  // all already declared in options
```

And new DOM events on the host element (mirroring the existing `calendar:*`
convention):

- `calendar:cellClick` — `{ date, resource, group, jsEvent, view }`
- `calendar:groupExpand` / `calendar:groupCollapse` — `{ groupId, view }`
- `calendar:rowHeightChange` — `{ height }`
- `calendar:modeChange` — `{ mode, context }`
- `calendar:offPeriodChange` — `{ offPeriod: boolean }`
- `calendar:suggestedSlotClick` — `{ start, end, resourceId, jsEvent, view }`
- `calendar:select` / `calendar:unselect` — already declared, just need wiring

---

## 4. Test posture

Each phase should ship JS-side Vitest + a Rails integration check where the
surface touches the gem (drag-to-reassign and bar-resize commit through
`calendarApi.updateEvent`, which Phase 14 already broadcasts). The new
view-level renderers each get a `cal-roster-*.png` screenshot under
`docs/images/` to keep README parity with the existing screenshot policy in
PLAN.md.

Suggested per-phase counts (matches the per-phase scale of Phase 17/18):

- Phase A: ~12 JS tests (groups, sticky header, empty-cell, NOW line, resize,
  reassign, narrow class) + 2 Rails (reassign via updateEvent broadcast,
  resize commit)
- Phase B: ~8 JS tests (hours mode, 4-week mode, sticky header, pinch zoom,
  today circle) + 1 screenshot per new mode
- Phase C: ~10 JS tests (week scroller, density dots, stripe style, tentative
  / conflict / recurring classes)
- Phase D: ~5 JS tests (setMode, suggestedSlot, cell-affordance gate)
- Phase E: ~3 JS tests (off-period flip, pill rendering)
- Phase F: ~6 JS tests (selectable wiring, constraint, longPress)

---

## 5. Explicit out-of-scope (calendar component does NOT own these)

The mockup contains many features. Most of them belong to the host app
(Rails + Stimulus controllers outside this package, AI tools, server-side
services). Listing them so the line is unambiguous:

### Chrome and navigation
- Nav-bar (`‹` back, `📅 Calendar ▾` lens dropdown, `📥³` unscheduled badge,
  `+` appointment, `⋯` more)
- Zoom-bar (`‹`, date label, Today/Week/Month segmented control, `›`,
  filter funnel) — the calendar exposes `prev/next/today/setOption('view',…)`;
  the chrome is the host's
- Date-row (lens + date label + jump-to-date trigger)
- Active-filters chip-row (Shopify-style)
- Bottom tab-bar (Home / Schedule / Comms / Sidekick / Menu)
- Status bar / notch / home-indicator (mockup wrapper only)

### Sheets, popovers, dialogs (every entry under §showcase)
- `sheet:lens-picker`, `sheet:roster-display-settings`,
  `sheet:unscheduled-list`, `sheet:action-schedule`, `sheet:new-appointment`,
  `sheet:appt-preview`, `sheet:row-action-appointment` (and `-tradie` variant),
  `sheet:longpress-toolbar` (and `-tradie` variant), `sheet:confirm-book`,
  `sheet:schedule-filter`, `sheet:jump-to-date`, `sheet:crew-editor`,
  `sheet:crew-editor-list`, `sheet:crew-picker`,
  `sheet:schedule-multi-assignee-picker`, `sheet:linked-record-picker`,
  `sheet:compose-message`, `sheet:unscheduled-row-action`,
  `sheet:jobs-index`, `sheet:linked-record-picker`
- `pop:appt-status-confirmed`, `pop:appt-status-tentative`, `pop:add-filter`
- `dialog:cancel-appointment`, `dialog:cancel-series`

The calendar's job is to fire the events that drive these (`eventClick`,
`eventLongPress`, `cellClick`, `groupExpand`, etc.). The sheets themselves
live in the host app.

### Smart features (AI tools, services)
- `Appointments::FindAvailableSlots` (smart-chip "Will is free Thu 9:00 AM")
- `Appointments::ConflictDetector` (conflict banner)
- `Appointments::ExpandSeries` (RRULE → occurrence expansion — calendar
  receives already-expanded events)
- `Appointments::ScheduleDayEntries`, `ScheduleOpsBuilder` (broadcast ops)
- `schedule_write__*` AI tools (mark_tentative, publish_appointment,
  cancel_appointment, etc.)
- All "smart suggest" chrome
- Customer SMS preview / send

### Business / data model
- Appointment type enum + colour map (`APPOINTMENT_TYPE_COLORS`) — the
  calendar exposes per-event `backgroundColor` + `classNames`; the colour map
  itself is a host concern. (The mockup's documented
  `appointment_type=job/quote_visit/site_visit/service_call/meeting/general`
  maps to whatever `extendedProps.appointmentType` the host sets.)
- `confirmation_state` enum, `recurring?`, `rrule` parsing — host provides;
  Phase C5/C6 only ship the **visual states** keyed off `extendedProps`
- Crew / staff_assignments / shift / online-pip — host data model. The
  calendar's `resourceGroups` (Phase A1) is the rendering primitive; the
  data binding is the host's job
- Role-based visibility (Tradie sees Calendar-only) — host filters which
  views to register
- `lock_version` / per-field concurrency — already in the gem's Field DSL;
  not a JS-side concern
- Per-user view-preference persistence (last-used lens / zoom) — cookie /
  user_settings on the host

### Other
- Map view (moved to standalone `/map` page in the mockup — explicitly not a
  Schedule concern)
- Empty-state mascot illustrations + copy (host)
- Customer / staff notifications (host)
- Push notifications, voice (Sidekick)
- Long-press haptic on mobile is already implemented in the existing
  Interaction plugin (`SNAP_HAPTIC_MS` / `DAY_DRAG_HAPTIC_MS`) — no change
  needed

---

## 6. Open questions before implementation

1. **`resourceTimelineDay` overload vs. new view name.** Re-using
   `resourceTimelineDay` with `slotMode: 'hours'` keeps the view name table
   short, but adding `resourceTimelineDayHours` is a clearer mental model and
   matches the existing convention of one view name per layout. Recommend
   the latter — also makes per-view `views: { resourceTimelineDayHours: {…} }`
   overrides cleaner.

2. **Group-header DOM vs. nested-resource expander.** ResourceTimeline already
   has a nested-resource expand/collapse. Groups (crews) are conceptually
   "one level above" that. Need to decide whether a group reuses the existing
   `payload.children` machinery (cheap, leaks "group is a parent resource")
   or gets a parallel rendering path (cleaner, more code). Recommend
   parallel — groups are not selectable resources and shouldn't appear in
   event-source `resourceIds`.

3. **Bar drag-to-reassign — single resource or multi?** Today
   `event.resourceIds` is a Set. Drag-to-reassign on a multi-resource event
   should probably replace the **single** dragged-from resource with the
   drop-target resource, not clobber the whole set. Confirm with a small
   spec before implementing.

4. **Mode + Stimulus values.** Should `mode` be a `data-calendar-mode-value`
   that the host can toggle declaratively (Turbo-friendly), or only
   imperative via `calendarApi.setMode`? Recommend both — declarative for
   server-rendered initial state, imperative for in-page transitions.

5. **Back-to-today pill placement.** The mockup floats it absolutely above
   the bottom tab-bar. Inside the calendar root the bottom-edge is the body
   itself; the pill should anchor to the **viewport** bottom of the body
   element. Implementable, but worth a styling pass against the existing
   `dayMaxEvents` overflow popover positioning.

---

## 7. What this plan does NOT touch

- The vkurko port (Phases 0–18) is feature-complete and stable. None of the
  work above changes existing view names, event shapes, or option contracts.
  Every addition is additive and opt-in. Existing demos in `demo/` continue
  to render unchanged.

- The Rails companion gem (`gem/stimulus_calendar_rails`) only needs the
  Phase A6 reassign payload echoed into the broadcast schema; everything
  else flows through the existing `updateEvent` → `calendar-event` Turbo
  Stream action. No DSL changes.

- Documentation (`README.md`, `docs/REFERENCE.md`,
  `skills/stimulus-calendar-*/SKILL.md`) gets per-phase appendices following
  the existing per-feature pattern in `PLAN.md`'s "Rules of engagement".
