# Live model sync over Turbo Streams — Rails cookbook

End-to-end walkthrough for wiring an Active Record model to a
`stimulus_calendar` calendar so every create / update / destroy
streams live to every other connected tab over Turbo Streams + Action
Cable.

Audience: an LLM doing a fresh integration. Read top-to-bottom — every
section is load-bearing. Skip nothing.

Related docs:
[`docs/BROADCAST.md`](BROADCAST.md) (wire format) ·
[`docs/RAILS_REFERENCE.md`](RAILS_REFERENCE.md) (engine API) ·
[`skills/stimulus-calendar-rails/SKILL.md`](../skills/stimulus-calendar-rails/SKILL.md)
(skill).

---

## TL;DR — the four wires

A live calendar in this gem is **four things in agreement**. Get any one
wrong and broadcasts go nowhere (or to the wrong subscriber).

| # | Wire | What it does | Where it lives |
|---|------|--------------|----------------|
| 1 | `Calendar` subclass | Declares the schema (fields, types, editable, validate, concurrency). The server's source of truth. | `app/calendars/event_calendar.rb` |
| 2 | `Broadcastable` model concern | After every commit, broadcasts a `<turbo-stream action="calendar-event">` to `streamables_for(resource)`. | `app/models/event.rb` |
| 3 | `turbo_stream_from(*streamables_for(...))` | Subscribes the browser to the same stream the broadcaster writes to. **Auto-rendered by the gem's `_calendar.html.erb` partial.** | the calendar view |
| 4 | `data-calendar-broadcast-value="turbo-stream"` | Turns on the JS broadcast bus + the `turbo:before-stream-render` adapter that interprets the custom action. **Auto-set by the gem's partial.** | the calendar element |

If you use the gem's bundled partial, wires 3 + 4 are free. You only
write 1 + 2.

---

## 1. Install (skip if already done)

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
StimulusCalendar.start(app)
StimulusCalendarRails.start(app)
```

```erb
<%# app/views/layouts/application.html.erb (head) %>
<%= stylesheet_link_tag "stimulus_calendar", "stimulus_calendar_rails" %>
<%= javascript_importmap_tags %>
```

The engine auto-registers its asset paths and importmap pins via
`StimulusCalendarRails::Engine` — no host-side configuration required
beyond the above.

---

## 2. The Calendar class — the schema

Every calendar that broadcasts needs a `StimulusCalendarRails::Calendar`
subclass. The class is the **single source of truth** for:

- What fields the calendar exposes (titles, times, color, resource_id, …)
- What field types they coerce to (`:string`, `:datetime`, `:enum`, `:reference`, `:reference_array`, …)
- Which fields are editable, by whom (`editable: true | ->(row, user) { … }`)
- Server-side validation (`validate: ->(value, row) { error_or_nil }`)
- Concurrency strategy (`concurrency: :last_write_wins` default | `:version_checked`)
- What gets broadcast on update (only fields declared via `field`
  appear in the update diff; an attribute change with no matching `field`
  is **silently dropped from the broadcast**).

```ruby
# app/calendars/event_calendar.rb
class EventCalendar < StimulusCalendarRails::Calendar
  resource :events            # URL segment + registry key + stream-name key
  model    Event

  field :title,       type: :string,   editable: true
  field :starts_at,   type: :datetime, editable: true, concurrency: :version_checked
  field :ends_at,     type: :datetime, editable: true, concurrency: :version_checked,
                      validate: ->(v, row) { "end must be after start" if row.starts_at && v <= row.starts_at }
  field :resource_id, type: :reference, editable: ->(_row, user) { user&.admin? }
  field :all_day,     type: :boolean,  editable: true
  field :color,       type: :string,   editable: false   # broadcast, but not client-editable

  # Tenant / authorization scoping. Used for every range fetch AND every
  # find() in PATCH/DELETE — a row outside this scope raises RecordNotFound.
  def scope(user = @user)
    self.class.model_class.where(account: user&.account)
  end

  # Attributes seeded into newly-created rows from the "+" / drag-to-create.
  def new_event_defaults
    { title: "New event", starts_at: 1.hour.from_now, ends_at: 2.hours.from_now }
  end
end
```

### Rules an LLM must not break

1. **`resource(:foo)` must be unique per process.** It registers the
   class in `StimulusCalendarRails.registry[:foo]`; declaring twice
   silently overwrites.
2. **Only fields declared via `field` round-trip.** A model attribute
   change with no matching `field` does NOT show up in the update
   broadcast. (See `Broadcastable#stimulus_calendar_broadcast_update` —
   it intersects `previous_changes.keys` with `fields_registry`.)
3. **`field :foo, type: :version_checked` is not a thing.** Concurrency
   is an *option* on a regular field: `field :starts_at, type: :datetime, concurrency: :version_checked`.
4. **`validate:` returns the error, not raises.** Return `nil`/`true`
   for OK, `String` for one error, `Array<String>` for many. Raising
   bypasses the gem's error-collection path.
5. **`editable: ->(row, user)`** is re-evaluated on every PATCH. The
   client-side editable flag is a hint only — never trusted.

---

## 3. Wire the model — `Broadcastable`

```ruby
# app/models/event.rb
class Event < ApplicationRecord
  include StimulusCalendarRails::Broadcastable
  broadcasts_calendar EventCalendar
  self.locking_column = :lock_version    # required for :version_checked fields
end
```

That's it. After `broadcasts_calendar EventCalendar`, every
**committed** save/update/destroy on `Event` (from anywhere — controller,
console, background job, callback) automatically emits a Turbo Stream:

| AR hook | Stream emitted |
|---------|----------------|
| `after_create_commit`  | `<turbo-stream action="calendar-event" op="add"    event-id="42" optimistic-id="…"><template>{full payload}</template></turbo-stream>` |
| `after_update_commit`  | `<turbo-stream action="calendar-event" op="update" event-id="42" optimistic-id="…"><template>{id, ...changed fields}</template></turbo-stream>` |
| `after_destroy_commit` | `<turbo-stream action="calendar-event" op="remove" event-id="42"><template>{id}</template></turbo-stream>` |

The broadcast goes to `Turbo::StreamsChannel.broadcast_stream_to(*streamables, content: html)`,
where `streamables = StimulusCalendarRails.streamables_for(:events)`.

### Rules an LLM must not break

1. **`broadcasts_calendar` takes the calendar class, nothing else.** No
   block, no hash. The stream name is derived from the calendar's
   `resource_name`.
2. **`include` BEFORE `broadcasts_calendar`.** The class macro is defined
   in the concern.
3. **Set `self.locking_column = :lock_version`** if any field uses
   `concurrency: :version_checked`. Without it, ActiveRecord can't
   detect stale writes.
4. **Don't use `broadcasts_to` / `broadcasts_refreshes_to` / `broadcast_replace_to`
   on the same model.** Those emit different stream actions
   (`replace`, `append`, `refresh`); calendars use the custom
   `calendar-event` action. Mixing them produces duplicate render passes
   and noisy logs.
5. **Authentication is `authenticate_user!`'s job, not the gem's.** The
   gem inherits `parent_controller` (default `ApplicationController`);
   whatever filters fire there fire on the calendar endpoints too.
   **Do not add `authenticate_user!` to gem controllers via monkeypatch
   — set `parent_controller` instead.**

---

## 4. Render — the gem's partial does wires 3 + 4 for you

```erb
<%# anywhere — typical: app/views/calendars/index.html.erb %>
<%= render partial: "stimulus_calendar_rails/calendars/calendar",
           locals: { calendar: EventCalendar.new(user: current_user),
                     events:   Event.between(@start, @end),
                     view:     "timeGridWeek" } %>
```

The partial (`gem/stimulus_calendar_rails/app/views/stimulus_calendar_rails/calendars/_calendar.html.erb`)
does these things for you, so you don't need to remember them:

1. Renders the calendar `<div>` with all `data-calendar-*-value`
   attributes derived from `calendar.class` + locals.
2. Sets `data-calendar-broadcast-value="turbo-stream"` — turns on the JS
   bus.
3. Sets `data-calendar-broadcast-channel-value="<resource_name>"` — purely
   informational; the actual transport is Turbo Streams.
4. **Calls `turbo_stream_from(*StimulusCalendarRails.streamables_for(resource_name))`**
   so the browser subscribes to exactly the streams the broadcaster
   writes to.

### When you should NOT use the partial

If you need a custom layout (event chip rendering, sidebars, multiple
calendars on one page), copy the partial's body into your own template
verbatim — and keep the `turbo_stream_from` line. Forgetting it is the
#1 reason "broadcasts fire but nothing shows up on the other tab".

### Available locals

| Local | Default | Notes |
|-------|---------|-------|
| `calendar` | **required** | `EventCalendar.new(user: current_user)` instance |
| `events`   | **required** | Range-windowed collection, e.g. `Event.between(start, end)` |
| `view`     | `"timeGridWeek"` | Any of the calendar's registered views |
| `plugins`  | `%w[DayGrid TimeGrid Interaction]` | Strings — names map to `src/plugins/` |
| `id`       | `"#{resource}-calendar"` | DOM id of the calendar element |
| `css_class`| `nil` | Extra CSS class on the calendar element |
| `height`   | `nil` | `"600px"` or `600` |
| `header_toolbar` | `{ start: "today", center: "title", end: "prev,next" }` | Passed as JSON |
| `editable` | `true` | Toggles drag/resize handles |
| `resources` | `nil` | Collection for resource / timeline views |

---

## 5. Multi-tenancy — the only thing you **must** read

Without ActsAsTenant, every subscriber sees every tenant's broadcasts.
With ActsAsTenant, isolation is automatic — **but only if the broadcast
happens inside the request's tenant context.**

```ruby
# config/initializers/stimulus_calendar_rails.rb
StimulusCalendarRails.parent_controller = "ApplicationController"
```

This makes the engine's controllers inherit your `ApplicationController`,
so any `before_action :set_current_tenant_through_filter` or
`authenticate_user!` filter runs on the calendar endpoints too.

### How tenant scoping flows

1. `StimulusCalendarRails.tenant_stream_token` reads
   `ActsAsTenant.current_tenant` and returns
   `"scr-tenant:#{tenant.class.name}:#{tenant.id}"` — or `nil` if no
   tenant is set (then scoping is a no-op).
2. `streamables_for(:events)` returns `[tenant_token, "scr-calendar:events"].compact`.
3. The view partial calls `turbo_stream_from(*streamables_for(:events))`
   inside the request → subscription is keyed to the user's tenant.
4. The model's `after_*_commit` callback calls
   `broadcast_stream_to(*streamables_for(:events))` inside the request →
   broadcast lands on the same tenant-scoped stream.

### The trap

If your **background job** changes an event, the job's `Event.update!`
fires the broadcast — but **the job has no tenant set** unless you
explicitly wrap it:

```ruby
class RescheduleEventJob < ApplicationJob
  def perform(tenant_id, event_id, new_starts_at)
    ActsAsTenant.with_tenant(Account.find(tenant_id)) do
      Event.find(event_id).update!(starts_at: new_starts_at)
    end
  end
end
```

Without `ActsAsTenant.with_tenant`, the broadcast goes to
`["scr-calendar:events"]` — and **no tenant-scoped subscriber receives
it**, because their subscription is on
`["scr-tenant:Account:42", "scr-calendar:events"]`.

(Action Cable stream matching is exact-string; the splat order matters
to Rails' channel-broadcast routing.)

---

## 6. Optimistic updates and echo suppression

When **the originator** of a change is also subscribed to the broadcast
stream (the common case — they're the user who dragged the event),
naive fan-out would echo the broadcast back to them and re-apply the
change locally. The gem handles this:

1. The client generates a `_scr_optimistic_id` for each local mutation
   (the JS broadcast bus has a per-page UUID called `origin`).
2. The client PATCHes the server with `optimistic_id: "<uuid>"`.
3. The events controller assigns it to `row._scr_optimistic_id` before
   `apply_field!`.
4. `Broadcastable#stimulus_calendar_broadcast_*` reads
   `_scr_optimistic_id` and tags the outbound turbo-stream's
   `optimistic-id` attribute.
5. Inbound broadcasts whose `optimistic-id` matches the bus's `origin`
   are dropped before they re-render.

You don't need to wire this yourself — but you do need to know that
mutations made **outside the request lifecycle** (console, background
job, another controller that doesn't set `_scr_optimistic_id`) will
*not* tag the broadcast, so the originator's tab will re-render the
change. This is harmless for true server-driven updates (e.g. a job
moved the event); it only matters when the user-facing client is also
the change author.

---

## 7. Broadcasting from outside Active Record

For coarse-grained changes that don't map to a single
create/update/destroy, you can emit broadcasts directly:

```ruby
streamables = StimulusCalendarRails.streamables_for(:events)

# Tell every connected client to re-fetch (e.g. after a bulk import):
Turbo::StreamsChannel.broadcast_stream_to(
  *streamables,
  content: StimulusCalendarRails::TurboStreams.event_refetch(calendar: :events),
)

# Custom update broadcast (e.g. from a background job that bypasses AR):
Turbo::StreamsChannel.broadcast_stream_to(
  *streamables,
  content: StimulusCalendarRails::TurboStreams.event_update(
    calendar: :events,
    event_id: 42,
    attributes: { starts_at: "2026-05-25T10:00:00Z", ends_at: "2026-05-25T11:00:00Z" },
    optimistic_id: nil,
  ),
)
```

Available builders (`StimulusCalendarRails::TurboStreams.*`):

- `event_add(calendar:, event_id:, payload:, optimistic_id: nil)`
- `event_update(calendar:, event_id:, attributes:, optimistic_id: nil)`
- `event_remove(calendar:, event_id:)`
- `event_refetch(calendar:)`
- `event_conflict(calendar:, event_id:, server_value:, client_value:, optimistic_id: nil)`
- `bulk(calendar:, streams:)` — wraps N child rows in one `op="bulk"` element for a single DOM reflow

`payload` and `attributes` are HTML-escaped JSON-encoded inside a
`<template>`. **Don't escape twice** — pass plain Ruby hashes.

---

## 8. Endpoints (mounted under `StimulusCalendarRails.mount_path`)

The engine ships these — the client's drag-resize PATCH and toolbar
add/delete events hit them. **Don't reimplement them in your app.**

| Verb + path | Action | Body |
|-------------|--------|------|
| `GET    /:resource/events?start=&end=` | `events#index`   | range-windowed JSON list |
| `POST   /:resource/events`             | `events#create`  | `{ attributes:{...}, optimistic_id }` |
| `PATCH  /:resource/events/:id`         | `events#update`  | `{ attributes:{...}, optimistic_id }` |
| `DELETE /:resource/events/:id`         | `events#destroy` | |
| `DELETE /:resource/events/bulk`        | `events#destroy_bulk` | `{ ids: [...] }` |
| `POST   /:resource/bulk`               | `events#bulk`    | `{ changes: [{ id, attributes, optimistic_id }, …] }` |
| `GET    /:resource/resources`          | `resources#index`| JSON resource list |

Server-side coercion + validation use `Field#coerce` and `Field#validate`
plus the model's own validations. Failures return `422` with
`{ errors: [...] }`.

---

## 9. Verifying the integration

After wiring, prove each link in the chain works before moving on. An
LLM should write/run these one at a time — don't assume the previous
link held.

### 9a. Broadcast fires (model layer)

```ruby
# Rails console
Event.create!(title: "Standup", starts_at: 1.hour.from_now, ends_at: 1.hour.from_now + 30.minutes)
# In the rails server log, look for:
#   [ActiveJob] ...Turbo::Streams::ActionBroadcastJob...
#   stream_name: ["scr-calendar:events"]
```

If you don't see the broadcast: `include StimulusCalendarRails::Broadcastable`
is missing or `broadcasts_calendar EventCalendar` was never called.

### 9b. Subscription is active (browser → server)

In the browser DevTools, switch to **Network → WS**, open the `/cable`
connection. Look for an inbound `subscribe` frame containing your
streamables, e.g.:

```json
{"command":"subscribe","identifier":"{\"channel\":\"Turbo::StreamsChannel\",\"signed_stream_name\":\"…\"}"}
```

Multiple `subscribe` frames means multiple `turbo_stream_from(...)`
calls in the page — usually harmless, but each one is a separate
subscription.

If you don't see any subscription: the partial didn't render, or
`turbo_stream_from` was stripped (a CSP `script-src` or a Turbo
disabled-by-default page).

### 9c. Inbound broadcast lands (server → browser)

With two browser tabs open on the same calendar, change an event from
the Rails console. The other tab should re-render within ~50ms. In
DevTools Console you can also listen:

```js
document.addEventListener('turbo:before-stream-render', e => {
  console.log('stream action:', e.detail.newStream.getAttribute('action'),
              'op:',           e.detail.newStream.getAttribute('op'));
});
```

You should see `action: calendar-event op: update` (or `add` / `remove`).

If the stream lands but the calendar doesn't update:
- The `data-calendar-broadcast-value="turbo-stream"` attribute is missing
  → adapter never attached. (Always set by the gem partial.)
- The bus's origin matches → echo dropped. Open a *separate browser
  profile* (not just a new tab) — same-process tabs share the same bus
  origin unless you reload.

### 9d. Optimistic-id echo suppression

```js
// In the originating tab's console, after dragging an event:
document.addEventListener('calendar:broadcast:in', e => console.log('in:', e.detail.message));
document.addEventListener('calendar:broadcast:out', e => console.log('out:', e.detail.message));
```

You'll see one `out:` for the drag and (correctly) **no `in:`** echoing
back. A second non-originating tab sees one `in:` and no `out:`.

---

## 10. Troubleshooting matrix

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| No broadcast in server logs after `Event.create!` | `Broadcastable` not included, or `broadcasts_calendar` not called | Add both. Concern + macro. |
| Broadcast in server logs but no second-tab update | Subscriber isn't on the same stream | Open DevTools → WS → check identifier; confirm `turbo_stream_from(*streamables_for(:events))` is rendered in the page HTML |
| Update broadcast missing a field that you changed | Field not declared with `field` in the Calendar | `field :that_attr, type: :string, editable: true` |
| Update broadcast empty (no `op="update"` event) | All changed AR attributes are outside `fields_registry` | Declare the changed field, or live with no broadcast on that attribute |
| Stale move silently overwrites | `concurrency: :version_checked` set but `self.locking_column` not on model | Add `self.locking_column = :lock_version` and a `lock_version` column |
| Tenant A sees Tenant B's events | Broadcaster ran without `ActsAsTenant.current_tenant` | Wrap the offending callsite in `ActsAsTenant.with_tenant(t) { … }` (especially in jobs) |
| Originator's tab double-applies its own drag | Originator's `_scr_optimistic_id` was never set (mutation from console / job) | Either ignore (harmless re-render of same data) or set `row._scr_optimistic_id = client_uuid` before save |
| Random "ActiveRecord::StaleObjectError" from `version_checked` | Two clients legitimately fighting | Render an `event_conflict` turbo-stream and let the user pick — see `TurboStreams.event_conflict` |
| `PATCH` returns 422 `field X is not editable` | `editable:` lambda returned false for that user/row | Audit the lambda; never reverse the policy on the client |
| Stylesheet 404 on `stimulus_calendar.css` | Engine's asset path not picked up | Confirm `stylesheet_link_tag "stimulus_calendar", "stimulus_calendar_rails"` is in the layout and the asset pipeline / propshaft can see `gem/stimulus_calendar_rails/app/assets/stylesheets/` |
| JS error "StimulusCalendar.start is not a function" | Bundle not loaded — the engine's importmap pin was missed | Ensure `<%= javascript_importmap_tags %>` is in `<head>` and the gem's `config/importmap.rb` is appended to the host app's importmap (the engine initializer does this automatically) |
| `RuntimeError: No calendar registered for resource :events` | The Calendar subclass is never autoloaded (no view references it before the request) | Put the file in `app/calendars/`; Rails autoload finds it. Or `require` it in an initializer for non-autoload paths. |
| Two calendars on one page, both subscribe to `scr-calendar:events` | Each renders its own `turbo_stream_from` — fine; broadcasts fan out to both | If you want isolated streams, give them different `resource :events_a` / `resource :events_b` and render two Calendar classes |

---

## 11. Common LLM mistakes (compiled from real-world stumbles)

These are the things that look fine in isolation but break the chain:

1. **Calling `broadcasts_to :events` (Turbo's built-in) instead of
   `broadcasts_calendar EventCalendar`.** They look similar; the former
   emits a `replace` action, the latter emits the custom `calendar-event`
   action. The JS bus only understands the latter.
2. **Putting `broadcasts_calendar EventCalendar` before
   `include StimulusCalendarRails::Broadcastable`.** `NoMethodError`.
3. **Defining `field` without a matching column.** ActiveRecord won't
   raise until the model is saved — but the broadcast diff will be empty
   for that field forever.
4. **Forgetting `self.locking_column`.** `:version_checked` silently
   degrades to last-write-wins. There's no warning.
5. **Trying to authenticate inside the gem's controllers.** Don't. Set
   `StimulusCalendarRails.parent_controller = "ApplicationController"`
   and let your existing `before_action :authenticate_user!` filter
   apply.
6. **Calling `Event.update_columns(...)`** — skips `after_*_commit`,
   skips the broadcast. Use `update!` or fall back to manual
   `Turbo::StreamsChannel.broadcast_stream_to` with
   `TurboStreams.event_update`.
7. **Rendering the calendar in a Turbo Frame that morphs on
   navigation.** The `turbo_stream_from` line is inside the frame; on
   morph the subscription gets torn down and re-created — broadcasts
   sent during the gap are lost. Render the calendar outside any
   page-level frame, or scope the frame so the subscription element
   stays mounted.
8. **Multi-tab demo from the same browser profile.** All tabs share the
   same JS bus `origin`; the second tab will incorrectly suppress the
   first tab's broadcasts as "own echo". Use two browser profiles or
   one normal + one private window.
9. **Using `DOMContentLoaded`** anywhere in custom JS that listens for
   calendar events. Rails apps are Turbo apps; use `turbo:load` or
   listen on the calendar element directly (events bubble).
10. **Subscribing from outside the gem partial without `streamables_for`.**
    Hand-rolled `turbo_stream_from "events"` doesn't match the stream
    name the broadcaster writes to (`scr-calendar:events` with optional
    tenant prefix). Always use `streamables_for(:events)`.

---

## 12. Minimal copy-paste recipe

The smallest working integration — paste into a fresh Rails app, run
migrations, boot, and live sync works end-to-end:

```ruby
# db/migrate/202X_create_events.rb
class CreateEvents < ActiveRecord::Migration[7.1]
  def change
    create_table :events do |t|
      t.string  :title,        null: false
      t.datetime :starts_at,   null: false
      t.datetime :ends_at,     null: false
      t.boolean  :all_day,     default: false
      t.string   :color
      t.integer  :resource_id
      t.integer  :lock_version, default: 0, null: false
      t.timestamps
    end
  end
end
```

```ruby
# app/models/event.rb
class Event < ApplicationRecord
  include StimulusCalendarRails::Broadcastable
  broadcasts_calendar EventCalendar
  self.locking_column = :lock_version

  scope :between, ->(s, e) { where("ends_at > ? AND starts_at < ?", s, e) }
end
```

```ruby
# app/calendars/event_calendar.rb
class EventCalendar < StimulusCalendarRails::Calendar
  resource :events
  model    Event

  field :title,     type: :string,   editable: true
  field :starts_at, type: :datetime, editable: true, concurrency: :version_checked
  field :ends_at,   type: :datetime, editable: true, concurrency: :version_checked,
                    validate: ->(v, row) { "end must be after start" if row.starts_at && v <= row.starts_at }
  field :all_day,   type: :boolean,  editable: true
  field :color,     type: :string,   editable: false
end
```

```ruby
# app/controllers/calendars_controller.rb
class CalendarsController < ApplicationController
  def index
    @start  = (params[:start]  || Time.zone.now.beginning_of_week).to_time
    @end    = (params[:end]    || Time.zone.now.end_of_week).to_time
    @events = Event.between(@start, @end)
  end
end
```

```erb
<%# app/views/calendars/index.html.erb %>
<%= render partial: "stimulus_calendar_rails/calendars/calendar",
           locals: { calendar: EventCalendar.new(user: current_user),
                     events:   @events,
                     view:     "timeGridWeek" } %>
```

```ruby
# config/routes.rb
Rails.application.routes.draw do
  mount ActionCable.server => "/cable"
  mount StimulusCalendarRails::Engine => StimulusCalendarRails.mount_path
  root "calendars#index"
end
```

Open two browser profiles on `/`. Drag an event in one. Watch the other
re-render.

---

## 13. Reading list (in order)

1. This file — wire-by-wire integration walkthrough.
2. [`docs/BROADCAST.md`](BROADCAST.md) — exact wire format, payload shape,
   echo-suppression rules.
3. [`docs/RAILS_REFERENCE.md`](RAILS_REFERENCE.md) — full API surface for
   the gem (every public class + method).
4. [`skills/stimulus-calendar-rails/SKILL.md`](../skills/stimulus-calendar-rails/SKILL.md)
   — concise LLM-oriented playbook (the same content, shorter).
5. [`RAILS.md`](../RAILS.md) — full feature scoping checklist (Phase 14+).
6. [`gem/demo/`](../gem/stimulus_calendar_rails) — runnable reference app
   (`bin/rails server`, `bin/rails test`).
