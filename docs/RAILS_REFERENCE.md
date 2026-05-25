# `stimulus_calendar_rails` — Rails engine API reference

Programmatic reference for the Rails companion gem. The JS-side reference
lives at [`docs/REFERENCE.md`](REFERENCE.md). Usage guide:
[`skills/stimulus-calendar-rails/SKILL.md`](../skills/stimulus-calendar-rails/SKILL.md)
and the main [`README.md#rails--hotwire-stimulus_calendar_rails`](../README.md#rails--hotwire-stimulus_calendar_rails).

## Module-level

```ruby
StimulusCalendarRails.parent_controller = "ApplicationController"  # default
StimulusCalendarRails.mount_path = "/calendars"                    # default

# Per-process Calendar class registry (populated by `resource :…`)
StimulusCalendarRails.lookup_calendar("events")    # → EventCalendar
StimulusCalendarRails.streamables_for("events")    # → ["scr-calendar:events"] (or tenant-scoped)
```

## `StimulusCalendarRails::Calendar`

Subclass to declare a calendar.

```ruby
class EventCalendar < StimulusCalendarRails::Calendar
  resource :events
  model    Event

  field :title,       type: :string,   editable: true
  field :starts_at,   type: :datetime, editable: true, concurrency: :version_checked
  field :ends_at,     type: :datetime, editable: true,
                      validate: ->(v, row) { "end must be after start" if row.starts_at && v <= row.starts_at }
  field :resource_id, type: :reference, editable: ->(_row, user) { user&.admin? }
  field :all_day,     type: :boolean,  editable: true
  field :color,       type: :string,   editable: false

  def scope(_user) = model_class.all       # tenant scoping hook
  def new_event_defaults = { title: "New event", ... }
end
```

### Class methods

| Method | Purpose |
|---|---|
| `resource(name)` | Register the URL segment / registry key. Registers `self` in `StimulusCalendarRails.registry`. |
| `model(klass)` | Active Record class to back this calendar. |
| `field(name, **opts)` | Add one field. Options: `type:` (see below), `editable:` (bool \| Proc(row, user)), `concurrency:` (`:last_write_wins` default \| `:version_checked`), `validate:` (Proc \| Array<Proc> returning error-strings), `enum_values:`, `header:`. |
| `resolve_field!(name)` | Lookup field by name; raises ArgumentError if absent. |
| `fields_registry` | The `{ name: Field }` hash. |

### Field types

`:string`, `:text`, `:integer`, `:datetime`, `:date`, `:boolean`, `:enum`,
`:reference`.

### Instance methods

| Method | Purpose |
|---|---|
| `scope(user = @user)` | Base relation. Override for tenant / authz scoping. |
| `fields` | Array of declared Field instances. |
| `event_to_h(row)` | Serialise a row to the JSON shape the JS bus broadcasts. |
| `event_to_json(row)` | Convenience for `event_to_h(row).to_json`. |
| `apply_field!(row, field, value)` | Validate + assign + save. Returns `[ok?, errors, mutations]`. |
| `field_value(row, field)` | Read a field's current value. |
| `new_event_defaults` | Attributes for new rows (override). |

## `StimulusCalendarRails::Field`

Created via `field` on a Calendar; not instantiated directly. See
[`gem/stimulus_calendar_rails/lib/stimulus_calendar_rails/field.rb`](../gem/stimulus_calendar_rails/lib/stimulus_calendar_rails/field.rb)
for the full surface — `editable_for?(row, user)`, `coerce(raw)`,
`validate(value, row)`.

## `StimulusCalendarRails::Broadcastable`

Active Record concern. Wires every commit to a `calendar-event` Turbo
Stream broadcast on the calendar's tenant-scoped stream.

```ruby
class Event < ApplicationRecord
  include StimulusCalendarRails::Broadcastable
  broadcasts_calendar EventCalendar
  self.locking_column = :lock_version    # required for :version_checked fields
end
```

| Hook | Broadcast |
|---|---|
| `after_create_commit` | `op="add"` + full payload via `event_to_h` |
| `after_update_commit` | `op="update"` + only the changed registered fields |
| `after_destroy_commit` | `op="remove"` + `{ id }` |

`_scr_optimistic_id` is a writeable attr; the cells controller sets it
before save so the broadcast carries the originator's nonce. The JS bus
drops messages whose `origin` matches its own, suppressing the echo.

## `StimulusCalendarRails::TurboStreams`

Helpers that produce `<turbo-stream action="calendar-event" op="...">`
HTML strings. Used internally by Broadcastable; available to apps that
want to emit custom broadcasts.

| Method | Notes |
|---|---|
| `event_add(calendar:, event_id:, payload:, optimistic_id:)` | `op=add`. Payload is JSON-encoded. |
| `event_update(calendar:, event_id:, attributes:, optimistic_id:)` | `op=update`. Only changed fields. |
| `event_remove(calendar:, event_id:)` | `op=remove`. |
| `event_refetch(calendar:)` | `op=refetch` — tells client to re-fetch source. |
| `event_conflict(calendar:, event_id:, server_value:, client_value:, optimistic_id:)` | `op=conflict` for `:version_checked` stale writes. |
| `bulk(calendar:, streams:)` | `op=bulk` wrapping N inner streams (single DOM reflow on the client). |

## Endpoints (under `StimulusCalendarRails.mount_path`, default `/calendars`)

| Verb + path | Action | Body |
|---|---|---|
| `GET /:resource/events?start=&end=` | `events#index` | JSON list, range-windowed |
| `POST /:resource/events` | `events#create` | `{ attributes: {...}, optimistic_id }` |
| `PATCH /:resource/events/:id` | `events#update` | `{ attributes: {...}, optimistic_id }` |
| `DELETE /:resource/events/:id` | `events#destroy` | |
| `DELETE /:resource/events/bulk` | `events#destroy_bulk` | `{ ids: [...] }` |
| `GET /:resource/resources` | `resources#index` | JSON list |
| `POST /:resource/bulk` | `events#bulk` | (Phase 14 cell-bulk endpoint — reserved) |
| `POST /:resource/undo` / `redo` | `history#undo` / `redo_change` | (audit table — opt-in) |

Server-side validation runs through `Field#coerce` + `Field#validate` and
the model's own validations. Failures return 422 with `{ errors: [...] }`.

## Configuration

```ruby
# config/initializers/stimulus_calendar_rails.rb
StimulusCalendarRails.parent_controller = "ApplicationController"
StimulusCalendarRails.mount_path        = "/admin/calendars"   # namespacing
```

The mount path is used by the gem's `app/views/.../calendars/_calendar.html.erb`
partial to derive client-side endpoint URLs, so namespacing the engine
and the partial stays in sync.

## Multi-tenancy

`streamables_for(resource)` returns a stream-name array that's tenant-
scoped automatically when `ActsAsTenant.current_tenant` is set (per
`tenant_stream_token`). One tenant's broadcasts never reach another's
subscribers because both the broadcaster (model callback) and the
subscriber (view partial's `turbo_stream_from`) derive the same token in
the same request/tenant context.
