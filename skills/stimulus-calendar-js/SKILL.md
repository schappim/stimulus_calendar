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

Every option below ships built in — **never tell users to look at upstream
docs.** Bundle options under `data-calendar-options-value` as a JSON object
or, equivalently, pass each one as `data-calendar-<kebab>-value`.

### Core (always available)

```
view (string) · views (object — per-view overrides)
plugins (string[]) · date (Date|ISO) · duration (Duration)
dateIncrement (Duration) · firstDay (0–6) · hiddenDays (number[])
validRange ({start, end}) · height (string|number)
theme (object|fn) · locale (string|object) · timeZone ("local"|"UTC"|IANA)
customScrollbars (bool) · viewDidMount (fn) · datesSet (fn)
loading (fn) · lazyFetching (bool) · highlightedDates ((Date|string)[])
titleFormat / dayHeaderFormat / dayHeaderAriaLabelFormat (Intl format)
icons (object|fn) · buttonText (object|fn) · customButtons (object)
headerToolbar ({start, center, end})
events ([]) · eventSources ([]) · eventFilter (fn) · eventOrder (fn|string|string[])
eventColor / eventBackgroundColor / eventTextColor (string)
eventClassNames (string|string[]|fn) · eventContent (fn|string|{html}|{domNodes})
eventDidMount (fn) · eventTimeFormat (Intl format) · displayEventEnd (bool)
eventClick / eventMouseEnter / eventMouseLeave / eventAllUpdated (fn)
selectable (bool)
```

### DayGrid plugin — `dayGridDay` / `dayGridWeek` / `dayGridMonth`

```
dayCellFormat (Intl format) · dayCellContent (fn|string|{html})
dayMaxEvents (bool|number) · moreLinkContent (fn|string)
dayPopoverFormat (Intl format)
weekNumbers (bool) · weekNumberContent (fn|string)
```

### TimeGrid plugin — `timeGridDay` / `timeGridWeek`

```
slotDuration / slotMinTime / slotMaxTime / slotLabelInterval / scrollTime (Duration)
slotHeight (number px) · slotLabelFormat (Intl format)
flexibleSlotTimeLimits (bool|object) · nowIndicator (bool) · slotEventOverlap (bool)
allDaySlot (bool) · allDayContent (fn|string|{html})
columnWidth (number px) · snapDuration (Duration)
```

### List plugin — `listDay` / `listWeek` / `listMonth` / `listYear`

```
listDayFormat / listDaySideFormat (Intl format)
noEventsContent (string|fn|{html}) · noEventsClick (fn)
```

### Resource + ResourceTimeGrid — `resourceTimeGridDay` / `…Week`

```
resources (Resource[]|fn|EventSource-shape) · refetchResourcesOnNavigate (bool)
datesAboveResources (bool)
resourceLabelContent (fn|string) · resourceLabelDidMount (fn)
filterResourcesWithEvents / filterEventsWithResources (bool)
```
Inherits every TimeGrid option.

### ResourceTimeline — `resourceTimelineDay` / `…Week` / `…Month` / `…Year`

```
slotWidth (number px) · monthHeaderFormat (Intl format)
resourceExpand (bool|'all'|number)
```
Inherits every TimeGrid + Resource option.

### Interaction plugin — drag / drop / resize / select / click

```
pointer (bool) · dateClick (fn)
editable (bool) · eventStartEditable (bool) · eventDurationEditable (bool)
eventResizableFromStart (bool)
eventDragStart / eventDragStop / eventDrop (fn)
eventResizeStart / eventResizeStop / eventResize (fn)
eventDragMinDistance (px) · eventLongPressDelay (ms)
dragConstraint (object) · dragScroll (bool) · snapDuration (Duration)
resizeConstraint (object)
selectable (bool) · select / unselect (fn)
unselectAuto (bool) · unselectCancel (CSS selector)
selectBackgroundColor (string) · selectConstraint (object)
selectMinDistance (px) · selectLongPressDelay (ms) · longPressDelay (ms)
```

### stimulus_calendar extensions (not in any upstream calendar lib)

```
data-calendar-event-source-value     URL  →  one URL event source
data-calendar-resource-source-value  URL  →  one URL resource source
data-calendar-broadcast-value        'turbo-stream' | 'action-cable' | 'websocket' | 'broadcast-channel' | false
data-calendar-broadcast-channel-value  channel name (BroadcastChannel) or URL (WS/AC)
```

### Event object shape (`events`, `eventSources`, `addEvent`, broadcasts)

```
id (string — required for updates/removes)
resourceIds (string[] — Resource views)
allDay (bool — inferred from noTimePart(start) if omitted)
start (Date|ISO — required) · end (Date|ISO — optional)
title (string) · display ('auto' | 'background')
backgroundColor / textColor / color (string)
classNames (string|string[])
editable / startEditable / durationEditable (bool — per-event overrides)
extendedProps (object — passed through to callbacks unchanged)
```

### Resource object shape (`resources`)

```
id (string — required) · title (string)
children (Resource[] — nested, rendered as a tree)
eventBackgroundColor / eventTextColor (string — defaults for events on this resource)
extendedProps (object)
```

## calendarApi (on `element.calendarApi`, ready after `calendar:ready`)

Every method below is built in. None require external docs.

```js
const api = document.querySelector('[data-controller~="calendar"]').calendarApi

// Events
api.addEvent({ id: "1", title: "Lunch", start: "2026-05-25T12:00", end: "2026-05-25T13:00" })
api.updateEvent({ id: "1", start: "2026-05-25T13:00", end: "2026-05-25T14:00" })  // partial patch
api.removeEventById("1")
api.getEvents()           // event[]   — every event currently in the dataset (post-filter)
api.getEventById("1")     // event | undefined
api.refetchEvents()       // Promise<void> — re-hit every event source URL/fn

// Resources
api.refetchResources()    // Promise<void>
api.getResources()        // resource[] (flat)

// Navigation
api.next();  api.prev();  api.today()
api.gotoDate("2026-06-15")
api.getView()             // { type, title, currentStart, currentEnd, activeStart, activeEnd }
api.dateFromPoint(x, y)   // { date, allDay, resource? } | null

// Options
api.setOption("view", "timeGridDay")
api.getOption("locale")

// Selection
api.unselect()

// IIFE convenience (boot without Stimulus)
StimulusCalendar.create(el, { view: "timeGridWeek", events: [...] })
StimulusCalendar.destroy(el)
```

## Events (on the calendar element)

Every event listed here is built in. The matching `data-calendar-<event>-value`
callback option fires for the same event — pick whichever is more ergonomic.
All events bubble.

| Event | `detail` shape | Fires when |
|---|---|---|
| `calendar:ready` | `{ api }` | Controller mounted; `element.calendarApi` callable. |
| `calendar:datesSet` | `{ start, end, view }` | Active date range changed. |
| `calendar:viewDidMount` | `{ view, el }` | A view's DOM first created. |
| `calendar:eventClick` | `{ event, jsEvent, view }` | User clicked an event. |
| `calendar:eventMouseEnter` | `{ event, jsEvent, view }` | Hover-in. |
| `calendar:eventMouseLeave` | `{ event, jsEvent, view }` | Hover-out. |
| `calendar:eventDidMount` | `{ event, el, view }` | Event DOM first inserted. |
| `calendar:eventAllUpdated` | `{}` | After every event re-render pass. |
| `calendar:dateClick` | `{ date, allDay, jsEvent, view, resource? }` | Click on an empty cell. |
| `calendar:eventDragStart` | `{ event, jsEvent, view }` | Drag begins. |
| `calendar:eventDragStop` | `{ event, jsEvent, view }` | Drag ends (before drop applies). |
| `calendar:eventDrop` | `{ event, oldEvent, delta, jsEvent, view, revert }` | Drop applied — call `revert()` to undo. |
| `calendar:eventResizeStart` | `{ event, jsEvent, view }` | Resize begins. |
| `calendar:eventResizeStop` | `{ event, jsEvent, view }` | Resize ends (before commit). |
| `calendar:eventResize` | `{ event, oldEvent, endDelta, jsEvent, view, revert }` | Resize commit — call `revert()` to undo. |
| `calendar:select` | `{ start, end, allDay, jsEvent, view, resource? }` | Drag-selection commits. |
| `calendar:unselect` | `{ jsEvent }` | Selection cleared. |
| `calendar:loading` | `{ isLoading }` | Event source starts/stops a fetch. |
| `calendar:broadcast:out` | `{ message }` | Local mutation about to publish. |
| `calendar:broadcast:in` | `{ message }` | Broadcast arrived from another tab/user. |

```js
calendar.addEventListener("calendar:ready", (e) => e.detail.api.refetchEvents())
calendar.addEventListener("calendar:eventDrop", (e) => save(e.detail).catch(e.detail.revert))
```

## Plugins

The calendar's behaviour is composed from named plugins. Pick the ones you
need; the controller lazily activates only the requested set.

- **DayGrid** — `dayGridMonth`, `dayGridWeek`, `dayGridDay` views.
- **TimeGrid** — `timeGridWeek`, `timeGridDay` with hour slots.
- **List** — `listDay`, `listWeek`, `listMonth`, `listYear` chronological list.
- **Resource** + **ResourceTimeGrid** — `resourceTimeGridDay`, `resourceTimeGridWeek`.
- **ResourceTimeline** — `resourceTimelineDay/Week/Month/Year`.
- **Interaction** — pointer, dateClick, drag/drop/resize, selection.

Pass them in `data-calendar-plugins-value` as a JSON array of names.

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
