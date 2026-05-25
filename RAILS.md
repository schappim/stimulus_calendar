# Hotwire-Native Event Calendar: Build Checklist

A scoping checklist for building a spreadsheet-grade live-editable event
calendar on top of Rails, Stimulus, Turbo Streams, and Action Cable. Designed
for multi-user editable schedules with frequent partial updates (drag, resize,
delete), server-driven event/resource schemas, and tenant-isolated streams.

Mirrors the shape of [stimulus_grid's RAILS.md](https://github.com/schappim/stimulus_grid/blob/main/RAILS.md)
but scoped to calendar surfaces (events, resources, time ranges) rather than
tabular cells. Ticked items land as PLAN.md's Phase 14 commits ship.

---

## 1. Custom Turbo Stream Actions

Built-in actions are row/element-oriented; calendars need event- and
resource-oriented actions.

- [ ] `calendar-event-add` — insert one event by id into every connected
      calendar (used by `after_create_commit`).
- [ ] `calendar-event-update` — patch one event's fields (title, times, color,
      resourceId, …) by id without re-rendering surrounding events.
- [ ] `calendar-event-remove` — delete one event by id.
- [ ] `calendar-event-confirm` — clear pending/optimistic state after the
      server reconciles a drag/resize/edit.
- [ ] `calendar-event-revert` — restore prior times + render inline error
      after server-side validation fails.
- [ ] `calendar-event-conflict` — render conflict UI with `server-value` vs
      `client-value` (e.g. stale `lock_version` on a move).
- [ ] `calendar-resource-add` / `…-update` / `…-remove` — same surgical
      updates for the resource axis (ResourceTimeGrid / ResourceTimeline).
- [ ] `calendar-source-refetch` — tell a client calendar to re-fetch its
      event source (after a coarse-grained server change you don't want to
      diff).
- [ ] `calendar-bulk` — atomic batched stream of inner actions (single DOM
      reflow for N updates).
- [ ] `calendar-presence` — per-user editing indicator on an event (someone
      is dragging this event right now).

---

## 2. Broadcast Scoping

Naive `broadcasts_to :events` firehoses every event change to every
subscriber. Fix the predicate layer.

- [ ] **Tenant-scoped streams** — broadcasts keyed by
      `ActsAsTenant.current_tenant` so a tenant's events never reach another
      tenant's subscribers. (Phase 14a — `streamables_for`.)
- [ ] **Signed view streams** — server mints a stream name encoding the
      subscriber's view range + resource filter, so an event entirely outside
      a viewer's window isn't broadcast to them.
- [ ] **Server-side range predicate** — events that start/end outside
      `[range.start, range.end]` are filtered before broadcast.
- [ ] **Viewport awareness** — Stimulus reports the visible date range over
      Action Cable (throttled); server uses it to scope broadcasts.
- [ ] **Out-of-range suppression** — bump a stale version stamp instead of
      broadcasting events the viewer can't see.
- [ ] **`broadcasts_calendar_to` DSL** with `scope:` lambda and declared
      `view_predicates` (mirrors `broadcasts_grid_to`).
- [ ] **Per-resource channels for hot resources** — narrow channels for
      high-traffic resources (rooms, vehicles, on-call rotations).

---

## 3. Morphing as the Default

Turbo 8 morph makes inline editing tolerable — make it the default merge
strategy for event replacements.

- [ ] Currently-focused popover / edit form survives an event update.
- [ ] Open day-popovers ("+3 more") survive the morph.
- [ ] Multi-select state (range selection) survives a server update.
- [ ] Scroll position untouched on TimeGrid / List / Timeline views.
- [ ] CSS transitions fire on the changed event (DOM node persists).
- [ ] Cheap `calendar-event-update` action available for the single-event hot
      path (no morph cost — surgical attribute update).

---

## 4. Optimistic Updates with Server Reconciliation

- [ ] Stimulus applies a drag / resize immediately with `data-pending`.
- [ ] PATCH includes an `X-Optimistic-Id` header.
- [ ] Server responds with `calendar-event-confirm` or `calendar-event-revert`
      (+ validation errors).
- [ ] Originating client suppresses its own broadcast echo by matching the
      optimistic id.
- [ ] Other clients receive normal `calendar-event-update` broadcasts.

---

## 5. Subscription Lifecycle

- [ ] **Reconnect replay** — client sends last-seen version stamp; server
      replays missed deltas as a `calendar-bulk`.
- [ ] **View / range handoff** — subscribe new view, wait for initial render,
      then tear down old (no empty flash on view switch).
- [ ] **Backpressure / coalescing** — collapse multiple pending updates for
      the same `(event_id)` to the latest only.

---

## 6. Stimulus Surface

- [ ] Primary `calendar` controller with outlets to satellite controllers
      (header-toolbar, day-cell, event, day-popover).
- [ ] View state as Stimulus values (view, date range, plugins, resources,
      filters).
- [ ] View state serializable into the signed stream name (§2).
- [ ] Resource name as a Stimulus value (drives endpoint paths).
- [ ] `calendar-sync` Stimulus controller (in the gem's app/javascript) glues
      `calendar:eventDrop` / `calendar:eventResize` / `calendar:dateClick`
      → server PATCH/POST, applies `calendar-event-*` Turbo Stream actions.

---

## 7. Server-Side Event Definition Registry

One source of truth per calendar — auth, coercion, validation, broadcast,
editor selection all flow from here. Mirrors stimulus_grid's column registry.

- [ ] `ApplicationCalendar` base class (`StimulusCalendarRails::Calendar`).
- [ ] Per-field `type:` (string, text, integer, datetime, date, boolean, enum,
      reference).
- [ ] Per-field `editable:` — boolean or lambda `(row, user) -> bool`.
- [ ] Per-field `editor:` — references a registered Stimulus editor
      controller (text / select / datetime-local / …).
- [ ] Per-field `validate` block — server-side validators
      (`->(value, row)` → error string/array/nil).
- [ ] Per-field `concurrency:` — `:last_write_wins`, `:version_checked`.
- [ ] Server re-checks `editable:` on every PATCH (never trust the client).
- [ ] Event payload (`event_to_h`) emits editor data attributes only for
      fields the user can edit.

---

## 8. Event Mutation Endpoint

- [ ] `PATCH /calendars/:resource/events/:id` — single endpoint for
      drag/resize/edit (not per-field).
- [ ] Request body: `{ attributes: {...}, optimistic_id, lock_version? }`.
- [ ] Response: always a Turbo Stream
      (`calendar-event-confirm`, `calendar-event-revert`, or `calendar-bulk`
      with cascades — e.g. updated resource summary).
- [ ] Controller stays thin (~15 lines); calendar class does the work.
- [ ] `POST /calendars/:resource/events` for create from drag-to-create or
      `+` button.
- [ ] `DELETE /calendars/:resource/events/:id` for per-event delete.
- [ ] `GET /calendars/:resource/events?start=&end=&resource_id=` for the
      server-side event source (range-windowed, tenant-scoped).

---

## 9. Edit Modes

### Drag / resize (default, 90% path)
- [ ] Click + drag an event → applies optimistically, PATCH on drop.
- [ ] Resize handle drag → applies optimistically, PATCH on release.
- [ ] Tab / Shift+Tab inside popover commits / cancels.
- [ ] `eventDrop` / `eventResize` carry `oldEvent` so the client can revert
      without a round-trip if the server rejects.

### Inline edit (event title / details)
- [ ] Click an event → popover with editable fields.
- [ ] Enter / blur commits via PATCH; Esc cancels.
- [ ] Server returns `calendar-event-confirm` / `calendar-event-revert` with
      per-field error annotations.

### Bulk move / paste
- [ ] Range selection across days → drag selected events together.
- [ ] PATCH to `/calendars/:resource/bulk` with `{ mutations: [...] }`.
- [ ] Server processes in a transaction; response is a `calendar-bulk`
      stream with per-mutation confirm/revert.

---

## 10. Cell / Slot Editor Components

- [ ] Editor registry keyed by field type
      (`CalendarEditors.register("color", ColorPickerController)`).
- [ ] Default editors: `string`, `text`, `integer`, `datetime`, `date`,
      `boolean`, `enum`, `reference`.
- [ ] Each editor controller mounts in the event popover, captures focus,
      handles Tab / Esc / Enter, emits `event:commit` / `event:revert`.
- [ ] `editor_config` flows from server field definition into editor's
      `data-*` attributes.

---

## 11. Validation

### Client-side (ergonomics)
- [ ] Runs in the editor controller before commit.
- [ ] No PATCH sent if it fails — event stays in edit mode with error visible.
- [ ] Covers: format, range (e.g. end > start), required, enum membership.

### Server-side (correctness)
- [ ] Runs in the calendar's `field validate:` block / model validations.
- [ ] On failure: `calendar-event-revert` carries an `errors` payload.
- [ ] Reverted values = current server state (not client's pre-edit values
      — may have drifted).
- [ ] Single `errors` payload shape consumed by event-level, popover-level,
      and bulk error UIs.

---

## 12. Computed Fields & Cascades

- [ ] Server determines any cascades (e.g. moving a parent event in a
      recurrence updates derived occurrences) — client does not recompute.
- [ ] PATCH response is a `calendar-bulk` stream containing the original
      confirm + all dependent event updates.
- [ ] `depends_on: [:starts_at]` declared on derived fields.
- [ ] Cascade computed once on the server, applied atomically on the client.

---

## 13. Concurrency Strategies (per-field)

- [ ] **Last-write-wins** (default) — simplest, fine for title/color/notes.
- [ ] **Version-checked** — PATCH carries `lock_version`; stale request
      returns `calendar-event-conflict` with "Keep mine / Use theirs" UI.
- [ ] Strategy is declared per-field; defaults to last-write-wins.

---

## 14. Create

### Drag-to-create
- [ ] Drag across empty time slots → creates a sentinel event with default
      values.
- [ ] First commit triggers `POST /calendars/:resource/events`.
- [ ] Server returns a stream replacing the sentinel with the persisted
      event (real id, defaults filled).
- [ ] Subsequent edits PATCH as normal.

### Modal / popover fallback
- [ ] For events with many required fields, fall back to a regular Turbo
      Frame form.

---

## 15. Delete

- [ ] Per-event delete (popover button or context menu) with confirm.
- [ ] Single broadcast: `calendar-event-remove`.
- [ ] Multi-select + Delete key: `DELETE /calendars/:resource/events/bulk`
      with ids array.
- [ ] Bulk response is a single `calendar-bulk` stream of
      `calendar-event-remove` actions.
- [ ] Soft-delete vs hard-delete configurable at calendar-class level.

---

## 16. Undo / Redo

- [ ] Server-side audit row per mutation with `prior_attributes`,
      `new_attributes`, `event_id`, `user_id`, `created_at`.
- [ ] `Cmd+Z` sends `POST /calendars/:resource/undo` with last un-undone
      mutation id.
- [ ] Server applies the inverse as a normal mutation (broadcasts fire,
      validations re-run, cascades cascade).
- [ ] Redo is symmetric.
- [ ] Scope: per-user, per-calendar, last N mutations within last M minutes
      (not global).

---

## 17. Permissions

- [ ] `editable:` accepts a lambda `(row, user) -> bool`, evaluated server-side.
- [ ] Non-editable events render without `data-editable="true"` (Stimulus
      Interaction plugin won't enter drag/resize mode).
- [ ] Server re-checks on every PATCH.
- [ ] Partial permissions per event supported (e.g. owner can edit title but
      not move to another resource).

---

## 18. Error UI

- [ ] **Event-level** — red border + hover tooltip with message; cleared on
      next successful commit.
- [ ] **Popover-level** — banner above popover with field highlighting
      (cross-field errors like `end_date < start_date`).
- [ ] **Bulk operation summary** — toast with "view errors" affordance
      scrolling to highlighted failed events.
- [ ] All three driven by the same `errors` payload shape — one error handler
      in the calendar controller.

---

## 19. What NOT to Build (Out of Scope)

- [ ] ~~Recurrence editor UI~~ (advanced — defer to FullCalendar pattern).
- [ ] ~~Full iCalendar import/export~~ (defer; expose payload format
      instead).

Resist generality. A generic client-side calendar is general because it
doesn't know your schema. A Rails-native calendar *does* know the schema, so
the `EventCalendar` declaration does 80% of what a generic calendar pushes
onto the client.

---

## 20. MVP Build Order

For shipping into a real product, build in this order:

1. [ ] Server-side event source endpoint + range-windowed fetch
2. [ ] `EventCalendar` declaration registry
3. [ ] Standard editors: `string`, `datetime`, `enum`, `reference`
4. [ ] Drag/resize → optimistic PATCH → server reconcile
5. [ ] Broadcastable model concern (auto add/update/remove broadcasts)
6. [ ] Version-checked concurrency
7. [ ] Drag-to-create + delete
8. [ ] Undo / redo
9. [ ] Recurrence cascade (last — high effort, narrow benefit)
10. [ ] Presence indicators (last — high effort, narrow benefit)

---

## 21. The 80% Feature Set

What every editable calendar actually needs:

- [ ] Multiple views (month / week / day / list / resource / timeline)
- [ ] Drag, resize, click-to-edit
- [ ] Multi-user live updates
- [ ] Server-side event sources with range windows
- [ ] Resource grouping
- [ ] Good keyboard navigation
