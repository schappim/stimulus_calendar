# `@ninjaai/stimulus_calendar` — programmatic API reference

Full method/event/option reference for the JS package. For the Rails
companion gem, see [`docs/RAILS_REFERENCE.md`](RAILS_REFERENCE.md).

Every option, attribute, event, and method below is exhaustively listed
in the main [`README.md`](../README.md) too — they're duplicated here as a
single-page reference for tooling that prefers programmatic docs.

## Boot

```js
import { Application } from "@hotwired/stimulus"
import StimulusCalendar from "@ninjaai/stimulus_calendar"
import "@ninjaai/stimulus_calendar/style.css"

const app = Application.start()
StimulusCalendar.start(app)
```

### IIFE / no-Stimulus path

```js
const el = document.getElementById("cal")
StimulusCalendar.create(el, {
  view: "timeGridWeek",
  events: [/* ... */],
})
StimulusCalendar.destroy(el)
```

## Options surface

See [`README.md#calendar-attributes-data-calendar--value`](../README.md#calendar-attributes-data-calendar--value)
for the canonical option table (every option grouped by plugin, with
default values and behaviour). The same table is mirrored in the LLM
skill at [`skills/stimulus-calendar-js/SKILL.md`](../skills/stimulus-calendar-js/SKILL.md).

Defaults are defined in `src/lib/options_store.js` (`baseDefaults`) and
per-plugin in `src/plugins/*.js` (`createOptions`).

## Public API

`element.calendarApi` (set after `calendar:ready`):

| Surface       | Methods                                                                 |
|---------------|-------------------------------------------------------------------------|
| Events        | `addEvent` · `updateEvent` · `removeEventById` · `getEvents` · `getEventById` · `refetchEvents` |
| Resources     | `refetchResources` · `getResources`                                     |
| Navigation    | `next` · `prev` · `today` · `gotoDate` · `getView` · `setOption` · `getOption` · `dateFromPoint` |
| Selection     | `unselect`                                                              |
| IIFE          | `StimulusCalendar.create(element, options)` · `StimulusCalendar.destroy(element)` |

## CustomEvents (on the calendar element)

Listed exhaustively in [`README.md#events-dispatched-on-the-calendar-element`](../README.md#events-dispatched-on-the-calendar-element)
and [`skills/stimulus-calendar-js/SKILL.md#events-on-the-calendar-element`](../skills/stimulus-calendar-js/SKILL.md#events-on-the-calendar-element).

Every event bubbles. The matching `data-calendar-<event>-value` callback
option also fires.

## Plugins

Built-in plugin registry: `src/plugins/index.js`.

- **DayGrid** — month/week/day grid. Views: `dayGridMonth`, `dayGridWeek`,
  `dayGridDay`. See `src/plugins/day_grid.js`.
- **TimeGrid** — sidebar of time slots + day columns. Views:
  `timeGridDay`, `timeGridWeek`. See `src/plugins/time_grid.js`.
- **List** — chronological list. Views: `listDay`, `listWeek`,
  `listMonth`, `listYear`. See `src/plugins/list.js`.
- **Resource** / **ResourceTimeGrid** — per-resource column TimeGrid.
  Views: `resourceTimeGridDay`, `resourceTimeGridWeek`. See
  `src/plugins/resource_time_grid.js`.
- **ResourceTimeline** — time horizontal, resources stacked. Views:
  `resourceTimelineDay/Week/Month/Year`. See
  `src/plugins/resource_timeline.js`.
- **Interaction** — pointer / drag / drop / resize / select / dateClick.
  See `src/plugins/interaction.js`.

Plugins are passed via `data-calendar-plugins-value` as a JSON array of
names:

```html
<div data-controller="calendar"
     data-calendar-plugins-value='["DayGrid", "Interaction"]'></div>
```

## Broadcast (live multi-user sync)

See [`docs/BROADCAST.md`](BROADCAST.md) for the full payload schema, adapter
table, and Rails recipe.

| Option            | Type    | Notes                                                                                     |
|-------------------|---------|-------------------------------------------------------------------------------------------|
| `broadcast`       | string  | `false` \| `"turbo-stream"` \| `"action-cable"` \| `"websocket"` \| `"broadcast-channel"` |
| `broadcastChannel`| string  | Channel name (BroadcastChannel) or URL (WS) or identifier (AC).                            |
| `broadcastFilter` | fn      | `({ op, event, meta }) => bool` — gate outbound publishes.                                 |

`element.dispatchEvent('calendar:broadcast:out')` / `…broadcast:in`
fire around every publish/receive.
