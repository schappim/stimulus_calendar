---
name: stimulus-calendar-js
description: Use stimulus_calendar, an HTML-first event calendar for Stimulus.js (Hotwire). Apply when adding or editing an interactive calendar/scheduler in a Stimulus/Hotwire (non-Rails-specific) front end — month/week/day/list/resource/timeline views, drag &amp; drop, event sources, broadcasting changes between tabs over BroadcastChannel/WebSocket. For the Rails server-driven version (Turbo Stream live sync, server-side event sources, optimistic edits with reconcile) use the stimulus-calendar-rails skill instead.
---

# Using stimulus_calendar (the JS library)

stimulus_calendar is a client-side event calendar built from Stimulus
controllers. **The HTML is the configuration** — drop `data-controller="calendar"`
on a `<div>`, pass options via `data-*` attributes, and the controllers
enhance it. A 100% Stimulus port of [vkurko/calendar](https://github.com/vkurko/calendar)
(Svelte 5; v5.7.1).

> **Status — early.** This skill grows with the library. Sections marked
> *(Phase N)* describe behaviour that lands as the matching PLAN.md phase
> ships. Always check the linked [PLAN.md](../../PLAN.md) for the current
> per-feature checklist.

## Setup (pick one)

**Plain script (no bundler):** the IIFE bundle includes Stimulus.
```html
<link rel="stylesheet" href="/path/dist/stimulus_calendar.css" />
<script src="/path/dist/stimulus_calendar.js"></script>
<script>StimulusCalendar.start()</script>
```

**ES module / importmap:** the ESM bundle externalizes `@hotwired/stimulus`.
```js
import { Application } from "@hotwired/stimulus"
import StimulusCalendar from "stimulus_calendar"
const app = Application.start()
StimulusCalendar.start(app)
```

`StimulusCalendar.start(app?)` registers the controllers (`calendar`, plus per-
view satellites as they ship) and returns the Application. Call it once.

## Minimal calendar

```html
<div data-controller="calendar"
     data-calendar-view-value="timeGridWeek"
     data-calendar-plugins-value='["TimeGrid", "Interaction"]'
     data-calendar-options-value='{
       "events": [
         { "id": "1", "title": "Standup",     "start": "2026-05-25T09:00", "end": "2026-05-25T09:30" },
         { "id": "2", "title": "Design crit", "start": "2026-05-26T14:00", "end": "2026-05-26T15:00" }
       ],
       "headerToolbar": { "start": "prev,next today", "center": "title", "end": "dayGridMonth,timeGridWeek,timeGridDay" }
     }'
     style="height: 600px"></div>
```

The calendar needs a height: set `style="height:…"` (or a CSS class), or use
`data-calendar-height-value="auto"`.

## Three ways to provide events

1. **Inline** — pass the array under `options.events` in
   `data-calendar-options-value` (server-rendered JSON works).
2. **URL** — `data-calendar-event-source-value="/events.json"` returns an
   array of events; refetched on view-range changes when `lazyFetching` is on.
3. **JS** — after `calendar:ready`:
   `el.calendarApi.addEvent({ id, title, start, end })`.

Each event needs a stable string id.

## Calendar attributes (on the `data-controller="calendar"` element)

> The full list is being filled in per-option as Phase 3 ships
> ([PLAN.md](../../PLAN.md) — Phase 3 enumerates all 24 global options).
> Documented here as they land:

- `data-calendar-view-value` — initial view name (e.g. `"dayGridMonth"`)
- `data-calendar-plugins-value` — JSON array of plugin names
  (`["DayGrid","TimeGrid","List","Resource","ResourceTimeGrid","ResourceTimeline","Interaction"]`)
- `data-calendar-options-value` — JSON of the rest of vkurko/calendar's
  options (events, locale, slotDuration, headerToolbar, …)
- `data-calendar-event-source-value` — URL returning a JSON array of events
- `data-calendar-resource-source-value` — URL returning a JSON array of resources
- `data-calendar-broadcast-value` — `false` | `"turbo-stream"` |
  `"action-cable"` | `"websocket"` | `"broadcast-channel"`
- `data-calendar-broadcast-channel-value` — channel name / URL for the
  chosen broadcast adapter

## calendarApi (on `element.calendarApi`, ready after `calendar:ready`)

```js
const api = document.querySelector('[data-controller~="calendar"]').calendarApi

// Events (Phase 12)
api.addEvent({ id: "1", title: "Lunch", start: "2026-05-25T12:00", end: "2026-05-25T13:00" })
api.updateEvent({ id: "1", title: "Lunch (moved)", start: "2026-05-25T13:00", end: "2026-05-25T14:00" })
api.removeEventById("1")
api.getEvents(); api.getEventById("1")
api.refetchEvents(); api.refetchResources()

// Navigation
api.next(); api.prev()
api.getView()                         // current view name, range, title
api.dateFromPoint(x, y)               // map screen coords → calendar date

// Options
api.setOption("view", "timeGridDay"); api.getOption("locale")

// Selection
api.unselect()
```

## Events (on the calendar element)

`calendar:ready` (`detail.api`) — call once the controller has mounted.
`calendar:datesSet` — fired when the displayed date range changes (nav, view).
`calendar:viewDidMount` — fired when a view is first mounted.
`calendar:eventClick` (`{event, jsEvent}`) — user clicked an event.
`calendar:eventMouseEnter` / `calendar:eventMouseLeave` — hover.
`calendar:eventDrop` (`{event, oldEvent, delta, revert}`) — drag-and-drop
moved an event. Call `e.detail.revert()` to undo if your server rejects it.
`calendar:eventResize` (`{event, oldEvent, endDelta, revert}`) — resize handle.
`calendar:dateClick` (`{date, jsEvent}`) — user clicked an empty cell.
`calendar:select` (`{start, end, allDay}`) — user selected a range.
`calendar:unselect` — selection cleared.
`calendar:broadcast:in` (`{message}`) — a broadcast arrived from another tab/user.
`calendar:broadcast:out` (`{message}`) — local change about to broadcast.

```js
calendar.addEventListener("calendar:ready", (e) => e.detail.api.refetchEvents())
calendar.addEventListener("calendar:eventDrop", (e) => save(e.detail).catch(e.detail.revert))
```

## Plugins

The calendar's behaviour is composed from named plugins (matching
vkurko/calendar's plugin set). Pick the ones you need:

- **DayGrid** (Phase 5) — `dayGridMonth`, `dayGridWeek`, `dayGridDay` views.
- **TimeGrid** (Phase 6) — `timeGridWeek`, `timeGridDay` with hour slots.
- **List** (Phase 7) — `listDay`, `listWeek`, `listMonth`, `listYear`
  chronological list view.
- **Resource** + **ResourceTimeGrid** (Phase 8) — `resourceTimeGridDay/Week`.
- **ResourceTimeline** (Phase 9) — `resourceTimelineDay/Week/Month/Year`.
- **Interaction** (Phase 11) — pointer, dateClick, drag/drop/resize, selection.

Pass them in `data-calendar-plugins-value` as a JSON array of names; the
controller lazily activates only the requested plugins.

## Broadcasting changes between tabs / users (Phase 13)

When `data-calendar-broadcast-value` is set, every local mutation (add /
update / remove via `calendarApi`, drag, resize, or `dateClick`+create) is
serialised as a JSON message and published to the chosen adapter. Inbound
messages from the same adapter are applied locally — origin-tagged to suppress
echo loops.

```html
<div data-controller="calendar"
     data-calendar-broadcast-value="broadcast-channel"
     data-calendar-broadcast-channel-value="team-cal"
     ... ></div>
```

| Adapter | Use case |
|---|---|
| `broadcast-channel` | Tab-to-tab sync within one browser; no server. |
| `websocket` | Raw WebSocket; you define the server format. |
| `action-cable` | Subscribe an Action Cable channel directly. |
| `turbo-stream` | `<turbo-stream action="calendar-event-…">` custom actions over Action Cable; pair with the `stimulus_calendar_rails` gem. |

Payload schema:

```json
{
  "op":     "add" | "update" | "remove" | "refetch",
  "event":  { "id": "...", "title": "...", "start": "...", "end": "...", ... },
  "meta":   { "channel": "...", "user": "..." },
  "origin": "<random nonce — used to suppress echo>"
}
```

See [`docs/BROADCAST.md`](../../docs/BROADCAST.md) (Phase 13) for the wire format
and Rails recipe.

## Gotchas

- The calendar manages its own internal DOM (re-renders cells/events on view
  change, scroll). Don't mutate event `<div>`s directly — change data via
  `calendarApi` and use `eventContent`/`dayCellContent` callbacks.
- Event id type matters for `updateEvent`/`removeEventById` — keep ids
  consistent (strings recommended).
- Set a height on the calendar element or scrollable views (TimeGrid, list)
  have nothing to scroll inside.
- When `lazyFetching: true`, an event source URL is re-hit on every view-range
  change; debounce / cache on your server.
- For multi-tab broadcasting without a server, use `"broadcast-channel"` —
  it's the simplest adapter and works offline.
