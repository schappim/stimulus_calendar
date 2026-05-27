---
name: stimulus-calendar-rails
description: Use the stimulus_calendar_rails gem to build a server-driven, multi-user editable event calendar in a Rails + Hotwire app. Apply when adding a calendar/scheduler backed by Active Record with live cross-tab/cross-user updates over Turbo Streams + Action Cable, drag-and-drop persistence, optimistic edits with server reconcile, server-side event sources, per-field permissions, version-checked moves, or multi-tenant isolation. For a purely client-side calendar with no Rails backend, use the stimulus-calendar-js skill instead.
---

# Using `stimulus_calendar_rails` (the Rails engine)

A Rails event calendar where **the `EventCalendar` declaration on the
server is the single source of truth** for auth, coercion, validation,
and broadcasting. The browser runs the `stimulus_calendar` JS; the gem
adds custom Turbo Stream actions so every model commit broadcasts live
to every connected tab.

> **Read these in order.** If you cherry-pick, you will miss a wire.
>
> 1. [The four wires](#the-four-wires) — the mental model.
> 2. [Setup](#setup) — install + boot.
> 3. [Step 1: Declare the calendar](#1-declare-the-calendar-source-of-truth) — `EventCalendar < StimulusCalendarRails::Calendar`.
> 4. [Step 2: Make the model broadcastable](#2-make-the-model-broadcastable) — three lines on the model.
> 5. [Step 3: Render with the partial](#3-render) — wires 3 + 4 for free.
> 6. [Multi-tenancy](#multi-tenancy--authentication--do-not-skip) — non-negotiable rules.
> 7. [Verification](#verification--prove-each-link-works) — prove the chain before you ship.
> 8. [Pitfalls list](#pitfalls-that-bite-llms) — read before writing code.
>
> Deeper material: [`docs/LIVE_SYNC_RAILS.md`](../../docs/LIVE_SYNC_RAILS.md)
> (full cookbook), [`docs/BROADCAST.md`](../../docs/BROADCAST.md) (wire
> format), [`docs/RAILS_REFERENCE.md`](../../docs/RAILS_REFERENCE.md)
> (API reference).

---

## The four wires

A live calendar is **four things in agreement**. Get any one wrong and
broadcasts go nowhere — or to the wrong subscriber.

| # | Wire | What it does | You write |
|---|------|--------------|-----------|
| 1 | `Calendar` subclass | Schema: fields, types, editable, validate, concurrency. The server's source of truth. | `app/calendars/event_calendar.rb` |
| 2 | `Broadcastable` model concern | After every commit, broadcasts `<turbo-stream action="calendar-event">` to `streamables_for(resource)`. | 3 lines in `app/models/event.rb` |
| 3 | `turbo_stream_from(*streamables_for(...))` | Subscribes the browser to the exact stream the broadcaster writes to. | **auto** (gem partial) |
| 4 | `data-calendar-broadcast-value="turbo-stream"` | Turns on the JS bus + custom-action adapter. | **auto** (gem partial) |

**Use the gem's `_calendar.html.erb` partial** and wires 3 + 4 are
free. You only write 1 + 2.

---

## Setup

```ruby
# Gemfile
gem "turbo-rails"
gem "stimulus-rails"
gem "importmap-rails"
gem "stimulus_calendar_rails"
```

```ruby
# config/routes.rb
mount ActionCable.server => "/cable"
mount StimulusCalendarRails::Engine => StimulusCalendarRails.mount_path  # default "/calendars"
```

```js
// app/javascript/application.js
import "@hotwired/turbo-rails"
import { Application } from "@hotwired/stimulus"
import StimulusCalendar from "stimulus_calendar"
import StimulusCalendarRails from "stimulus_calendar_rails"
const app = Application.start()
StimulusCalendar.start(app)        // base calendar controllers
StimulusCalendarRails.start(app)   // calendar-sync + Turbo Stream actions
```

```erb
<%# app/views/layouts/application.html.erb <head> %>
<%= stylesheet_link_tag "stimulus_calendar", "stimulus_calendar_rails" %>
<%= javascript_importmap_tags %>
```

To namespace the endpoints (and the stream names) set the mount path
and parent controller in an initializer:

```ruby
# config/initializers/stimulus_calendar_rails.rb
StimulusCalendarRails.parent_controller = "ApplicationController"   # Devise / ActsAsTenant
StimulusCalendarRails.mount_path        = "/admin/calendars"        # optional
```

The engine auto-pins `stimulus_calendar` + `stimulus_calendar_rails` via
importmap and ships the CSS; host apps need no JS build step.

---

## 1. Declare the calendar (source of truth)

```ruby
# app/calendars/event_calendar.rb
class EventCalendar < StimulusCalendarRails::Calendar
  resource :events      # URL segment + registry key + stream-name key
  model    Event

  field :title,       type: :string,   editable: true
  field :starts_at,   type: :datetime, editable: true, concurrency: :version_checked
  field :ends_at,     type: :datetime, editable: true, concurrency: :version_checked,
                      validate: ->(v, row) { "end must be after start" if row.starts_at && v <= row.starts_at }
  field :resource_id, type: :reference, editable: ->(_row, user) { user&.admin? }
  field :all_day,     type: :boolean,  editable: true
  field :color,       type: :string,   editable: false

  # Tenant / authorization scoping. Used for every range fetch AND every
  # find() on PATCH/DELETE — a row outside this scope raises RecordNotFound.
  def scope(user = @user)
    self.class.model_class.where(account: user&.account)
  end

  # Attributes seeded into newly-created rows from the "+" / drag-to-create.
  def new_event_defaults
    { title: "New event", starts_at: 1.hour.from_now, ends_at: 2.hours.from_now }
  end
end
```

**Field types:** `:string :text :integer :datetime :date :boolean :enum :reference :reference_array :string_array`.

**Field options:**

| Option | Values | Default |
|--------|--------|---------|
| `editable:` | `true` / `false` / `->(row, user) { bool }` | `false` |
| `validate:` | `->(value, row) { error_string \| array \| nil }` or array of procs | `nil` |
| `concurrency:` | `:last_write_wins` \| `:version_checked` | `:last_write_wins` |
| `enum_values:` | array (required for `type: :enum`) | `nil` |
| `header:` | display label | `name.humanize` |

**Rules you cannot break:**

1. `resource(:foo)` must be unique per process — it registers the class
   in a global `StimulusCalendarRails.registry`.
2. **Only fields declared via `field` round-trip** through the gem.
   Update broadcasts intersect `previous_changes.keys` with
   `fields_registry` — an AR attribute change with no matching `field`
   is silently dropped from the broadcast.
3. `validate:` returns errors; it does NOT raise. Return `nil`/`true`
   for OK, `String` for one error, `Array<String>` for many.
4. `editable:` is re-evaluated server-side on every PATCH. The client's
   editable flag is a hint only — never trusted.
5. `new_event_defaults` is a calendar instance method, not a field
   option.

---

## 2. Make the model broadcastable

```ruby
# app/models/event.rb
class Event < ApplicationRecord
  include StimulusCalendarRails::Broadcastable
  broadcasts_calendar EventCalendar
  self.locking_column = :lock_version    # required for :version_checked fields
end
```

After this, **every** `create` / `update` / `destroy` commit on `Event`
— from anywhere (controller, console, callback, background job) —
automatically broadcasts a `<turbo-stream action="calendar-event"
op="add|update|remove">` to the calendar's tenant-scoped stream. No
manual broadcast calls.

| AR hook | Stream `op` | Template payload |
|---------|-------------|------------------|
| `after_create_commit`  | `add`    | full payload from `Calendar#event_to_h` |
| `after_update_commit`  | `update` | only the changed *registered* fields, `{ id, …diff… }` |
| `after_destroy_commit` | `remove` | `{ id }` |

**Rules you cannot break:**

1. `include` BEFORE `broadcasts_calendar` — the macro is defined in the
   concern.
2. `broadcasts_calendar` takes **only** the calendar class. No block,
   no hash, no stream name.
3. Set `self.locking_column = :lock_version` (and have a `lock_version`
   column) if any field is `concurrency: :version_checked`. Without it,
   the gem silently degrades to last-write-wins.
4. **Don't combine with Turbo's built-in `broadcasts_to`** /
   `broadcast_replace_to`. Those emit `replace`/`append`/`refresh`
   actions; calendars use the custom `calendar-event` action. Mixing
   the two means duplicate render passes.
5. **`Event.update_columns(...)`** skips `after_*_commit` and therefore
   skips the broadcast. Use `update!` or manually call
   `Turbo::StreamsChannel.broadcast_stream_to` with the helpers in
   `StimulusCalendarRails::TurboStreams`.

---

## 3. Render

```erb
<%= render partial: "stimulus_calendar_rails/calendars/calendar",
           locals: { calendar: EventCalendar.new(user: current_user),
                     events:   Event.between(@start, @end),
                     view:     "timeGridWeek" } %>
```

The gem's partial does all of this for you:

- Builds the `<div data-controller="calendar">` with every
  `data-calendar-*-value` attribute derived from the calendar class and
  locals.
- Sets `data-calendar-broadcast-value="turbo-stream"` — the JS adapter
  attaches.
- **Calls `turbo_stream_from(*StimulusCalendarRails.streamables_for(resource_name))`**
  so the browser subscribes to exactly the streams the broadcaster
  writes to.

**Optional locals:** `id:`, `css_class:`, `height:`, `plugins:` (array
of strings), `resources:` (collection), `header_toolbar:` (hash),
`editable:` (bool).

**If you can't use the partial** (custom layout, multiple calendars,
embedded in a frame): copy the partial body verbatim — and **keep the
`turbo_stream_from(*streamables_for(...))` line**. Forgetting it is the
#1 reason "broadcasts fire but nothing shows up on the other tab".

---

## Multi-tenancy & authentication — do not skip

```ruby
# config/initializers/stimulus_calendar_rails.rb
StimulusCalendarRails.parent_controller = "ApplicationController"
```

This makes the gem's controllers inherit your `ApplicationController`,
so existing filters (`authenticate_user!`,
`set_current_tenant_through_filter`) apply to calendar endpoints too.

### Tenant scoping is automatic — but only inside a tenant context

`streamables_for(:events)` returns
`[tenant_token, "scr-calendar:events"].compact` where `tenant_token` is
`"scr-tenant:#{tenant.class.name}:#{tenant.id}"` whenever
`ActsAsTenant.current_tenant` is set, else `nil` (compacted out).

The same call inside the model commit hook and the view partial means
broadcaster and subscriber land on the same stream — *for the same
tenant*. A different tenant sees nothing.

### The job trap

A background job has **no tenant set** by default. If the job mutates
an event, the broadcast lands on the non-tenant stream and tenant-scoped
subscribers won't get it:

```ruby
class RescheduleJob < ApplicationJob
  def perform(tenant_id, event_id, new_starts_at)
    ActsAsTenant.with_tenant(Account.find(tenant_id)) do
      Event.find(event_id).update!(starts_at: new_starts_at)
    end
  end
end
```

Wrap **every job/rake task/console session that mutates events** in
`ActsAsTenant.with_tenant(t) { ... }`. Without ActsAsTenant the rule is
moot (tenant_token is `nil`); with ActsAsTenant it's load-bearing.

---

## Optimistic-id flow (echo suppression)

You don't wire this; it's done for you. But you need to know it exists.

1. The browser's `BroadcastBus` generates a per-page UUID `origin` at
   construction.
2. When the user drags an event, the calendar-sync layer PATCHes the
   server with `optimistic_id: "<origin>-<seq>"`.
3. `events_controller#update` assigns it to `row._scr_optimistic_id`
   before `apply_field!`.
4. The model commit hook tags the outbound `<turbo-stream>` with
   `optimistic-id="…"`.
5. Inbound broadcasts where `optimistic-id` matches the bus's `origin`
   are dropped before re-render → no double-apply on the originator.

Mutations from outside the request lifecycle (Sidekiq, console) don't
set `_scr_optimistic_id`, so the originating user's tab also re-renders.
That's harmless — server is authoritative.

---

## Toolbar actions (drive the calendar from outside)

The calendar element is `#<resource>-calendar` (or the `id:` local). A
toolbar anywhere on the page can drive it via CustomEvents:

```js
const cal = document.getElementById("events-calendar")
cal.dispatchEvent(new CustomEvent("calendar-sync:add-event", {
  detail: { attributes: { title: "Standup",
                          starts_at: "2026-05-25T09:00",
                          ends_at:   "2026-05-25T09:30" } }
}))
cal.dispatchEvent(new CustomEvent("calendar-sync:delete-event", { detail: { id: "42" } }))
cal.dispatchEvent(new CustomEvent("calendar-sync:refetch"))
```

These dispatch through the gem's calendar-sync layer, which PATCHes /
POSTs / DELETEs the engine's endpoints. Don't `fetch()` the endpoints
yourself unless you have to — let the events dispatch do it so
optimistic-id is set.

---

## Broadcasting from outside Active Record

When AR isn't the trigger (bulk import, derived data, scheduled
roll-up), broadcast manually:

```ruby
streamables = StimulusCalendarRails.streamables_for(:events)

# Cheapest "I changed a lot" signal — clients re-fetch:
Turbo::StreamsChannel.broadcast_stream_to(
  *streamables,
  content: StimulusCalendarRails::TurboStreams.event_refetch(calendar: :events),
)

# Precise update:
Turbo::StreamsChannel.broadcast_stream_to(
  *streamables,
  content: StimulusCalendarRails::TurboStreams.event_update(
    calendar: :events, event_id: event.id,
    attributes: { starts_at: event.starts_at.iso8601, ends_at: event.ends_at.iso8601 },
  ),
)

# Bulk N updates as one DOM reflow:
inner = events.map { |e|
  StimulusCalendarRails::TurboStreams.event_update(
    calendar: :events, event_id: e.id,
    attributes: { color: e.color },
  )
}
Turbo::StreamsChannel.broadcast_stream_to(
  *streamables,
  content: StimulusCalendarRails::TurboStreams.bulk(calendar: :events, streams: inner),
)
```

Multi-tenant apps: wrap in `ActsAsTenant.with_tenant(t) { ... }`.

---

## Endpoints (provided by the engine)

The engine ships these — the JS drag-resize layer and the toolbar
events hit them. **Don't reimplement them in your app.**

| Verb + path | Body |
|-------------|------|
| `GET    /:resource/events?start=&end=` | range-windowed JSON list |
| `POST   /:resource/events`             | `{ attributes:{...}, optimistic_id }` |
| `PATCH  /:resource/events/:id`         | `{ attributes:{...}, optimistic_id }` |
| `DELETE /:resource/events/:id`         | |
| `DELETE /:resource/events/bulk`        | `{ ids: [...] }` |
| `POST   /:resource/bulk`               | `{ changes: [{ id, attributes, optimistic_id }, …] }` |
| `GET    /:resource/resources`          | JSON resource list |

Server-side coercion + validation use `Field#coerce` and `Field#validate`
plus the model's own validations. Failures return `422` with
`{ errors: [...] }`.

---

## Verification — prove each link works

After wiring, walk through these in order. **Don't skip; don't assume
the previous link held.**

**Link A — broadcast fires (model):**

```ruby
Event.create!(title: "Test", starts_at: 1.hour.from_now, ends_at: 2.hours.from_now)
# Expect: a Turbo::Streams::ActionBroadcastJob line in the server log
# referencing stream_name: ["scr-calendar:events"] (plus tenant prefix
# if ActsAsTenant is active).
```

**Link B — subscription active (browser):**

DevTools → Network → WS → `/cable` → look for an inbound `subscribe`
frame with the streamables in the identifier. Multiple subscribes are
fine (one per `turbo_stream_from`).

**Link C — inbound landing:** open two **different browser profiles**
(not just two tabs — same-process tabs share the JS bus origin and
suppress each other's echoes). Drag in one; the other re-renders.

**Link D — echo suppression:**

```js
document.addEventListener('calendar:broadcast:in',  e => console.log('in:',  e.detail.message));
document.addEventListener('calendar:broadcast:out', e => console.log('out:', e.detail.message));
```

The originator's tab sees `out:` only; the peer sees `in:` only.

---

## Pitfalls that bite LLMs

1. **`broadcasts_to :events` (Turbo built-in) instead of
   `broadcasts_calendar EventCalendar`.** Different action; client
   ignores it.
2. **`broadcasts_calendar EventCalendar` before `include
   StimulusCalendarRails::Broadcastable`.** `NoMethodError`.
3. **`field :foo` with no matching column.** No raise; update diffs
   silently empty for that field forever.
4. **Forgetting `self.locking_column`.** `:version_checked` silently
   degrades.
5. **Authenticating inside the gem's controllers via monkeypatch.**
   Don't. Set `parent_controller`.
6. **`Event.update_columns(...)`** — skips commit hook, skips
   broadcast. Use `update!`.
7. **Calendar inside a page-level Turbo Frame that morphs on nav.**
   The `turbo_stream_from` element gets torn down + recreated on every
   morph; broadcasts during the gap are lost. Keep the calendar (and
   its `turbo_stream_from`) outside the morphing frame.
8. **Two-tab demo from the same browser profile.** Same bus origin →
   second tab suppresses the first tab's broadcasts as own-echo. Use
   two profiles, or one normal + one private window.
9. **`DOMContentLoaded`** anywhere in custom JS that listens for
   calendar events. Rails apps are Turbo apps — listen on `turbo:load`
   or directly on the calendar element (events bubble).
10. **Hand-rolled `turbo_stream_from "events"`.** Doesn't match the
    broadcaster's stream name (`scr-calendar:events`, optionally
    tenant-prefixed). Always use
    `turbo_stream_from(*StimulusCalendarRails.streamables_for(:events))`.
11. **Mutating events from a job without `ActsAsTenant.with_tenant`.**
    Broadcast lands on the wrong stream; tenant-scoped subscribers
    never see it.
12. **Forgetting `authenticate_user!` is YOUR `ApplicationController`'s
    job.** Setting `parent_controller` is what propagates it; trying to
    `before_action :authenticate_user!` inside a gem controller is a
    monkeypatch waiting to bite you.

---

## Deeper reading

- [`docs/LIVE_SYNC_RAILS.md`](../../docs/LIVE_SYNC_RAILS.md) — the full
  cookbook (12 sections, verification ladder, troubleshooting matrix).
- [`docs/BROADCAST.md`](../../docs/BROADCAST.md) — wire format spec
  (element attributes, per-op JSON shape, stream-name rules).
- [`docs/RAILS_REFERENCE.md`](../../docs/RAILS_REFERENCE.md) — module
  + class + method API surface.
- [`RAILS.md`](../../RAILS.md) — feature scoping checklist (Phase 14+).
- [`gem/demo/`](../../gem/stimulus_calendar_rails) — runnable reference
  app (`bin/rails server`, `bin/rails test`).
- Client-only calendar (no Rails)? Use
  [`stimulus-calendar-js`](../stimulus-calendar-js/SKILL.md) instead.
