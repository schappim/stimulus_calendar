# Live multi-user sync — BroadcastBus

`stimulus_calendar` ships a transport-agnostic `BroadcastBus`: every local
mutation (add / update / remove / drag / resize) is JSON-serialised and
published to a pluggable adapter; inbound messages from peers drive the
local calendar API. The same bus powers all four shipped adapters —
`broadcast-channel` (tab-to-tab within one browser), `websocket` (raw),
`action-cable`, and `turbo-stream` (paired with the `stimulus_calendar_rails`
gem).

## Enable

Pass `broadcast` + `broadcastChannel` either as HTML attributes:

```html
<div data-controller="calendar"
     data-calendar-plugins-value='["DayGrid","Interaction"]'
     data-calendar-broadcast-value="broadcast-channel"
     data-calendar-broadcast-channel-value="team-cal"></div>
```

…or in the options bundle:

```js
StimulusCalendar.create(el, {
  view: 'timeGridWeek',
  broadcast: 'turbo-stream',         // or 'action-cable' | 'websocket' | 'broadcast-channel'
  broadcastChannel: 'events:42',     // channel name (BroadcastChannel) or URL (WS) or identifier (AC)
  broadcastFilter: ({ op, event }) => op !== 'remove',   // optional outbound gate
})
```

## Payload schema

Every message is one JSON object:

```json
{
  "op":     "add" | "update" | "remove" | "refetch",
  "event":  { "id": "1", "title": "...", "start": "...", "end": "..." },
  "meta":   { "user": 42, "channel": "events:42" },
  "origin": "<random nonce — the bus suppresses echo when origin matches its own>"
}
```

- `add` — insert (or replace) an event by id.
- `update` — patch known fields on an event by id.
- `remove` — only `event.id` is required.
- `refetch` — calls `calendarApi.refetchEvents()` on the receiver.

The originator tags every outbound message with its own random `origin`;
the bus drops inbound messages whose `origin` matches. This means a server
that fan-outs to every connected client (including the originator)
doesn't cause a local re-render of the originator's own change.

## Conflict policy

Default is **last-write-wins** by `event.id`. Pass a custom
`broadcastResolve(localEvent, remoteEvent) → mergedEvent` (Phase 13 polish)
to override.

## Adapters

| Adapter           | Use case                                                                                          |
|-------------------|---------------------------------------------------------------------------------------------------|
| `broadcast-channel` | Tab-to-tab inside one browser. Zero server. Best for demos.                                     |
| `websocket`       | Raw WebSocket. Server payload format is what your app uses (the bus JSON-encodes both directions). |
| `action-cable`    | Subscribes an existing Action Cable consumer to a channel identifier.                            |
| `turbo-stream`    | Listens for `<turbo-stream action="calendar-event">` over Action Cable; emits outbound via a `stimulus-calendar:broadcast` CustomEvent the gem listens for. **Pair with `stimulus_calendar_rails`.** |

### Rails recipe (turbo-stream adapter)

The companion gem [`stimulus_calendar_rails`](../gem/stimulus_calendar_rails)
ships a `Broadcastable` model concern that wires every create/update/destroy
into a `<turbo-stream action="calendar-event">` broadcast:

```ruby
class Event < ApplicationRecord
  include StimulusCalendarRails::Broadcastable
  broadcasts_calendar EventCalendar
end
```

The matching client side just sets `broadcast: 'turbo-stream'` — no
channel name needed; the gem's view partial calls
`turbo_stream_from(*StimulusCalendarRails.streamables_for(:events))` so
the subscription is established automatically.

For a full integration walkthrough — installation, multi-tenancy,
optimistic-id flow, troubleshooting matrix — see
[`docs/LIVE_SYNC_RAILS.md`](LIVE_SYNC_RAILS.md). The sections below
specify the on-the-wire format the gem and the JS adapter agree on; if
you're hand-rolling a server that mimics the gem, this is the contract.

---

## Turbo Streams wire format (Rails adapter)

Every broadcast from the gem is one `<turbo-stream>` element with
`action="calendar-event"`. The verb lives on the `op` attribute; routing
the verb through one Turbo action (instead of registering six actions)
keeps the JS adapter trivial and avoids per-op registration churn.

### Element shape

```html
<turbo-stream
  action="calendar-event"
  calendar="events"
  op="add | update | remove | refetch | conflict | bulk"
  event-id="42"
  optimistic-id="o-7f93…"     <!-- present only for add/update/destroy initiated by a known client -->
>
  <template>{HTML-escaped JSON payload}</template>
</turbo-stream>
```

Attribute notes:

- All attribute names are **kebab-cased** on the wire even though the
  Ruby helper takes snake-cased kwargs (`event_id:`, `optimistic_id:`).
  The serializer (`StimulusCalendarRails::TurboStreams.tag`) translates
  `_` → `-` automatically.
- `calendar` is the calendar's `resource_name` (string). It's
  informational — the client routes purely on `op`, not `calendar`.
  But it's useful for debugging when two calendars share a page.
- `event-id` is always a string on the wire (Active Record's `id.to_s`).
- `optimistic-id` is the same nonce the client sent on its
  PATCH/POST/DELETE (and the same as the JS bus's `origin` for that
  page). Inbound messages whose `optimistic-id` matches the local bus's
  `origin` are dropped without re-rendering.

### Per-op payloads

The `<template>` contents are HTML-escaped JSON. After parsing:

| `op` | Template JSON |
|------|---------------|
| `add`      | The full event payload, exactly the shape `Calendar#event_to_h` emits: `{ "id":42, "title":"…", "starts_at":"2026-…T…Z", "ends_at":"…", … }`. ISO-8601 strings for datetimes; primitive types otherwise. |
| `update`   | `{ "id":42, …only changed registered fields… }`. Fields not declared via `field` are NOT in the payload, even if the model attribute changed. |
| `remove`   | `{ "id":42 }`. |
| `refetch`  | empty (`""`). The client calls `calendarApi.refetchEvents()`. |
| `conflict` | `{ "id":42, "server_value":"…", "client_value":"…" }`. Emitted (manually) when a `:version_checked` field PATCH is stale. |
| `bulk`     | Raw concatenation of N inner `<turbo-stream action="calendar-event">…</turbo-stream>` elements (already serialized). Applied as one DOM reflow on the client. |

### Stream name (the channel identifier)

The model's `Broadcastable#stimulus_calendar_broadcast` calls:

```ruby
Turbo::StreamsChannel.broadcast_stream_to(
  *StimulusCalendarRails.streamables_for(self.class.stimulus_calendar_class.resource_name),
  content: message,
)
```

where `streamables_for(:events)` returns:

```ruby
[
  StimulusCalendarRails.tenant_stream_token,    # "scr-tenant:Account:42" if ActsAsTenant.current_tenant; else nil → compacted out
  "scr-calendar:events",                         # always present
].compact
```

`turbo_stream_from(*streamables_for(:events))` produces a signed stream
name that includes both tokens in order — Action Cable matches on the
*exact* signed-string equality, so the broadcaster and subscriber must
splat the same array in the same order. **Don't pass the streamables as
a single string; pass the array via splat.**

### Echo suppression

Each calendar element gets one JS `BroadcastBus`. The bus generates a
per-page `origin` (UUID) at construction time. Outbound messages set
`origin = bus.origin`; inbound messages where `message.origin ===
bus.origin` are dropped silently.

For Rails-driven broadcasts, the originator's `_scr_optimistic_id` on
the AR row is what ends up in the `optimistic-id` element attribute.
The JS adapter promotes `optimistic-id` to `meta.optimistic_id` on the
parsed message; downstream conflict / pending-edit UI can match on it.

If a server mutation has no originator (background job, console), the
`optimistic-id` attribute is omitted and every client (including the
one whose user triggered the job) re-renders normally. That's almost
always what you want.

---

## Sending broadcasts directly (without going through Active Record)

Sometimes you need to push to the calendar from somewhere that isn't an
Event commit — a bulk import job, a webhook handler, a daily roll-up.
Use `StimulusCalendarRails::TurboStreams` to build the element, then
broadcast it on the same stream the partial subscribes to:

```ruby
streamables = StimulusCalendarRails.streamables_for(:events)

# Tell every client to re-fetch (cheapest "I changed a lot" signal):
Turbo::StreamsChannel.broadcast_stream_to(
  *streamables,
  content: StimulusCalendarRails::TurboStreams.event_refetch(calendar: :events),
)

# Push a precise update without an AR write (e.g. from a Sidekiq job
# computing a derived field):
Turbo::StreamsChannel.broadcast_stream_to(
  *streamables,
  content: StimulusCalendarRails::TurboStreams.event_update(
    calendar: :events,
    event_id: event.id,
    attributes: { color: "#ff8800" },
  ),
)

# Wrap several edits into one DOM reflow:
inner = events.map { |e|
  StimulusCalendarRails::TurboStreams.event_update(
    calendar: :events, event_id: e.id,
    attributes: { starts_at: e.starts_at.iso8601, ends_at: e.ends_at.iso8601 },
  )
}
Turbo::StreamsChannel.broadcast_stream_to(
  *streamables,
  content: StimulusCalendarRails::TurboStreams.bulk(calendar: :events, streams: inner),
)
```

Inside a Sidekiq / ActiveJob worker, **wrap the broadcast in
`ActsAsTenant.with_tenant(tenant) { … }`** if the host app is
multi-tenant; otherwise the broadcast lands on the non-tenant stream
and tenant-scoped subscribers won't receive it.

## Events

`stimulus_calendar` dispatches two CustomEvents on the calendar element
around every broadcast:

- `calendar:broadcast:out` (`{ message }`) — fired right before a local
  mutation is sent.
- `calendar:broadcast:in` (`{ message }`) — fired when an inbound message
  arrives (and is not an echo).

Listen for these to wire your own UI (e.g. "Alex just moved this event"
toast):

```js
calendar.addEventListener('calendar:broadcast:in', (e) => {
  toast(`${e.detail.message.meta.user} ${e.detail.message.op}d an event`);
})
```
