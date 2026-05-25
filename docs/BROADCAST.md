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
