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

For a step-by-step Rails integration (model + Calendar + partial +
multi-tenancy + verification ladder), see
[`docs/LIVE_SYNC_RAILS.md`](LIVE_SYNC_RAILS.md).

| Option            | Type    | Notes                                                                                     |
|-------------------|---------|-------------------------------------------------------------------------------------------|
| `broadcast`       | string  | `false` \| `"turbo-stream"` \| `"action-cable"` \| `"websocket"` \| `"broadcast-channel"` |
| `broadcastChannel`| string  | Channel name (BroadcastChannel) or URL (WS) or identifier (AC).                            |
| `broadcastFilter` | fn      | `({ op, event, meta }) => bool` — gate outbound publishes.                                 |

`element.dispatchEvent('calendar:broadcast:out')` / `…broadcast:in`
fire around every publish/receive.


## Recipes

### Avatar-stack chip content (Roster lens)

ResourceTimeline bars render bare titles by default. To show a stack of
assignee avatars on each chip (matching the Day-view tile in the tradie
mockup), pass an `eventContent` recipe that reads `extendedProps.staff`:

```js
calendarApi.setOption("eventContent", ({ event }) => {
  const wrap = document.createElement("div");
  wrap.className = "ec-chip-row";

  const title = document.createElement("span");
  title.className = "ec-event-title";
  title.textContent = event.title || "";
  wrap.append(title);

  const staff = event.extendedProps?.staff;
  if (Array.isArray(staff) && staff.length) {
    const avatars = document.createElement("span");
    avatars.className = "ec-avatars";
    for (const s of staff.slice(0, 3)) {
      const av = document.createElement("span");
      av.className = "ec-avatar";
      av.style.background = s.color || "#94a3b8";
      av.textContent = (s.initials || s.name?.[0] || "?").slice(0, 2);
      avatars.append(av);
    }
    if (staff.length > 3) {
      const more = document.createElement("span");
      more.className = "ec-avatar ec-avatar-more";
      more.textContent = `+${staff.length - 3}`;
      avatars.append(more);
    }
    wrap.append(avatars);
  }
  return { domNodes: [wrap] };
});
```

Minimal CSS to match:

```css
.ec-chip-row { display: flex; align-items: center; gap: 6px; }
.ec-avatars  { display: flex; gap: 2px; margin-left: auto; }
.ec-avatar {
  width: 18px; height: 18px; border-radius: 50%;
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 9px; font-weight: 600; color: white;
}
.ec-avatar-more { background: #cbd5e1; color: #1f2937; }
```

The host owns the data shape (`extendedProps.staff` is whatever the host
sends down). The calendar only exposes the slot.

### confirmationState + recurring badges

Set `event.extendedProps.confirmationState` to `"tentative"`,
`"confirmed"`, or `"cancelled"` and the renderer adds the matching
`.ec-event-*` class. Default CSS dashes the border (tentative),
strikes the title (cancelled), and outlines in red when
`extendedProps.conflict === true`.

Set `event.extendedProps.rrule` (any truthy value) and the renderer
appends a small loop badge in front of the title plus
`.ec-event-recurring` for hooks.

