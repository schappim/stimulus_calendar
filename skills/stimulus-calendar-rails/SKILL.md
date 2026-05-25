---
name: stimulus-calendar-rails
description: Use the stimulus_calendar_rails gem to build a server-driven, multi-user editable event calendar in a Rails + Hotwire app. Apply when adding a calendar/scheduler backed by Active Record with live cross-tab/cross-user updates over Turbo Streams + Action Cable, drag-and-drop persistence, optimistic edits with server reconcile, server-side event sources, per-field permissions, version-checked moves, or multi-tenant isolation. For a purely client-side calendar with no Rails backend, use the stimulus-calendar-js skill instead.
---

# Using stimulus_calendar_rails (the Rails engine)

A Rails event calendar where **the server `EventCalendar` declaration is the
source of truth** (auth, coercion, validation, broadcast). The browser runs
the `stimulus_calendar` JS; the gem adds a Stimulus `calendar-sync` layer +
custom Turbo Stream actions so every drag, resize and edit broadcasts live to
every tab.

> **Status — early.** This skill grows as PLAN.md's Phase 14 ships. Sections
> marked *(Phase 14n)* describe behaviour that lands as the matching commit
> goes in. Always check [PLAN.md](../../PLAN.md) for the current state.

## Setup

```ruby
# Gemfile
gem "turbo-rails"
gem "stimulus-rails"
gem "importmap-rails"
gem "stimulus_calendar_rails"   # or: path: "…/gem/stimulus_calendar_rails"
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

```ruby
# config/routes.rb
mount ActionCable.server => "/cable"
mount StimulusCalendarRails::Engine => StimulusCalendarRails.mount_path   # default "/calendars"
```

To namespace the endpoints, set the path and mount at it (the calendar builds
its client requests from `mount_path`, so they follow automatically):

```ruby
# config/initializers/stimulus_calendar_rails.rb
StimulusCalendarRails.mount_path = "/admin/calendars"
# StimulusCalendarRails.parent_controller = "ApplicationController"   # Devise/ActsAsTenant
```

The engine auto-pins `stimulus_calendar` + `stimulus_calendar_rails` via
importmap and ships the CSS; host apps need no JS build step.

## 1. Declare the calendar (server-side event registry — Phase 14b)

```ruby
# app/calendars/event_calendar.rb
class EventCalendar < StimulusCalendarRails::Calendar
  resource :events      # the URL segment + registry key
  model    Event

  field :title,       type: :string,   editable: true
  field :starts_at,   type: :datetime, editable: true, concurrency: :version_checked
  field :ends_at,     type: :datetime, editable: true, concurrency: :version_checked,
                      validate: ->(v, row) { "end must be after start" if v <= row.starts_at }
  field :resource_id, type: :reference, editable: ->(row, user) { user&.admin? }
  field :all_day,     type: :boolean,  editable: true
  field :color,       type: :string,   editable: false

  # Optional: authorization / tenant scoping. Used for every lookup + range query.
  def scope(user) = model_class.all          # e.g. model_class.where(account: user.account)

  # Optional: defaults for the "new event" sentinel.
  def new_event_defaults = { title: "New event", starts_at: 1.hour.from_now, ends_at: 2.hours.from_now }
end
```

**Field types** (Phase 14b): `string text integer datetime date boolean enum reference`.
**Field options:** `editable:` (bool or `->(row, user)`), `validate:`
(`->(value, row)` → error string/array/nil), `concurrency:`
(`:last_write_wins` default | `:version_checked`), `header:`, `default:`.

## 2. Make the model broadcastable (Phase 14d)

```ruby
class Event < ApplicationRecord
  include StimulusCalendarRails::Broadcastable
  broadcasts_calendar EventCalendar                # auto create/update/destroy broadcasts
  self.locking_column = :lock_version              # required for :version_checked fields
end
```

After this, **every** create/update/destroy automatically broadcasts the right
Turbo Stream action (`calendar-event-add` / `calendar-event-update` /
`calendar-event-remove`) to the calendar's tenant-scoped stream — including
changes made from the console, jobs, or other controllers. No manual broadcast
calls.

## 3. Render (Phase 14f)

```erb
<%= render partial: "stimulus_calendar_rails/calendars/calendar",
           locals: { calendar: EventCalendar.new(user: current_user),
                     events: Event.between(@start, @end),
                     view: "timeGridWeek" } %>
```

Optional locals: `id:`, `css_class:`, `height:`, `plugins:` (array),
`resources:` (relation), `header_toolbar:` (hash), `editable:` (bool or hash).
The partial renders the `.ec` element with all `data-calendar-*-value`
attributes derived from the calendar class + locals, plus the
`turbo_stream_from` subscription.

## What you get out of the box (Phase 14 targets)

- **Drag/resize → optimistic PATCH → reconcile.** Drag an event → `calendar-
  sync` PATCHes `/calendars/:resource/events/:id` with an `optimistic_id`; the
  event applies immediately, then a green confirm or red revert (with the
  server's `errors`). Other tabs get the broadcast.
- **Validation + permissions** run server-side on every PATCH
  (`editable_for?`, `validate`). Never trusts the client.
- **Version-checked concurrency:** `:version_checked` fields send
  `lock_version`; a stale move returns a `calendar-conflict` (listen for
  `calendar:eventConflict`).
- **Server-side event sources.** `EventCalendar#scope(user)` plus
  `?start=&end=` gives lazy, range-windowed fetches with tenant scoping
  applied.

## Toolbar actions (dispatch events on the calendar element)

The calendar element is `#<resource>-calendar` (or the `id:` local). A
toolbar anywhere on the page drives it via events:

```js
const cal = document.getElementById("events-calendar")
cal.dispatchEvent(new CustomEvent("calendar-sync:add-event",
  { detail: { attributes: { title: "Standup", starts_at: "2026-05-25T09:00", ends_at: "2026-05-25T09:30" } } }))
cal.dispatchEvent(new CustomEvent("calendar-sync:delete-event", { detail: { id: "42" } }))
cal.dispatchEvent(new CustomEvent("calendar-sync:refetch"))
```

## Custom Turbo Stream actions (Phase 14c)

The gem registers calendar-aware actions on top of the standard Turbo
Streams set:

| Action | Effect |
|---|---|
| `calendar-event-add` | Insert one event by id |
| `calendar-event-update` | Patch one event's fields by id |
| `calendar-event-remove` | Delete one event by id |
| `calendar-resource-add` / `…-update` / `…-remove` | Same for resources |
| `calendar-source-refetch` | Force-refetch a server event source |
| `calendar-bulk` | Atomic batched stream of inner actions |
| `calendar-conflict` | Server vs client value conflict (e.g. stale `lock_version` on a move) |

```ruby
render turbo_stream: StimulusCalendarRails::TurboStreams.event_update(
  calendar: "events", event_id: event.id,
  attributes: { starts_at: event.starts_at.iso8601, ends_at: event.ends_at.iso8601 },
  optimistic_id: params[:optimistic_id],
)
```

## Endpoints (provided by the engine under the mount point — Phase 14e)

`GET /calendars/:resource/events?start=&end=` (range fetch, JSON) ·
`POST /calendars/:resource/events` (create) ·
`PATCH /calendars/:resource/events/:id` (drag/resize/edit) ·
`DELETE /calendars/:resource/events/:id` ·
`GET /calendars/:resource/resources` (resource list, JSON).

## Multi-tenancy &amp; auth (Devise + ActsAsTenant) — avoid data leaks

```ruby
# config/initializers/stimulus_calendar_rails.rb
StimulusCalendarRails.parent_controller = "ApplicationController"
```

This makes the gem's controllers inherit your base controller, so your
`authenticate_user!` and `set_current_tenant_through_filter` before_actions
run on the calendar endpoints too. Combined with:

- **scoped lookups** — every event is fetched via
  `calendar.scope(current_user).find`, so events outside the user's/tenant's
  scope raise `RecordNotFound`; override `scope(user)` for custom
  authorization, and
- **tenant-scoped streams** — broadcasts are keyed by
  `ActsAsTenant.current_tenant`,

…one tenant never sees another tenant's events or broadcasts. Without
ActsAsTenant the tenant scoping is a no-op and `scope` defaults to
`model_class.all`.

## Gotchas

- `broadcasts_calendar` takes only the calendar class (stream is derived +
  tenant-scoped).
- `:version_checked` needs `self.locking_column` on the model.
- Drag/resize edits return `204` and rely on the auto-broadcast; the
  originating tab applies the change when the broadcast lands (~50ms),
  matched to its `optimistic_id`.
- For client-only calendars (no Rails backend), use the `stimulus-calendar-js`
  skill — don't pull this gem into a non-Rails project.
