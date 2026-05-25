# stimulus_calendar

[![CI](https://github.com/schappim/stimulus_calendar/actions/workflows/ci.yml/badge.svg)](https://github.com/schappim/stimulus_calendar/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@ninjaai/stimulus_calendar?label=npm)](https://www.npmjs.com/package/@ninjaai/stimulus_calendar)
[![stimulus_calendar_rails gem](https://img.shields.io/gem/v/stimulus_calendar_rails?label=stimulus_calendar_rails)](https://rubygems.org/gems/stimulus_calendar_rails)

A full-sized, **HTML-first event calendar for [Stimulus.js](https://stimulus.hotwired.dev/) (Hotwire)** — month, week, day, list, resource and timeline views, drag &amp; drop, resource scheduling, and **live multi-user sync over Turbo Streams**. Drop `data-controller="calendar"` on a `<div>`, describe the calendar with `data-*` attributes, and you get a working calendar — no React, no build-time options object, no third-party scheduling framework. With the optional [`stimulus_calendar_rails`](gem/stimulus_calendar_rails) companion, every drag, resize or edit also **streams live to every connected client over Turbo Streams** (Action Cable) — optimistic updates, server-side validation, and tenant-scoped broadcasts included.

A 100% Stimulus port of [vkurko/calendar](https://github.com/vkurko/calendar) (Svelte 5; v5.7.1). Inspired by [FullCalendar](https://fullcalendar.io/).

![stimulus_calendar — month view with multi-day events spanning weeks, today highlighted, week numbers in the gutter](docs/images/cal-overview.png)

> Prefer the Rails/Hotwire server-driven version — live multi-user editing
> over Turbo Streams, server-side event sources, optimistic updates, and
> drag/drop persistence? It ships as the **`stimulus_calendar_rails`** gem;
> see the **Rails & Hotwire** section below,
> [`gem/stimulus_calendar_rails`](gem/stimulus_calendar_rails), and
> [`RAILS.md`](RAILS.md). LLM usage docs live in [`skills/`](skills).

## Status

🚧 **Early — migration in progress.** See [PLAN.md](./PLAN.md) for the
per-feature checklist. Each unchecked box is a planned commit, shipped with
tests, a demo, a screenshot, and (where Rails-touching) a matching
`gem/demo/test/` case run against a real Rails app.

---

## Install

**Option A — plain `<script>` (no bundler).** Self-contained IIFE bundle with
Stimulus included; works over `file://`, a static server, anything. Vendor the
files from `dist/`, or load them from a CDN:

```html
<link rel="stylesheet" href="https://unpkg.com/@ninjaai/stimulus_calendar/dist/stimulus_calendar.css" />
<script src="https://unpkg.com/@ninjaai/stimulus_calendar/dist/stimulus_calendar.js"></script>
<script> StimulusCalendar.start() </script>
```

**Option B — npm + a bundler (Vite, esbuild, webpack…).** Stimulus is a peer
dependency, so install it alongside:

```bash
npm install @ninjaai/stimulus_calendar @hotwired/stimulus
```

```js
import { Application } from "@hotwired/stimulus"
import StimulusCalendar from "@ninjaai/stimulus_calendar"   // resolves to dist/stimulus_calendar.esm.js
import "@ninjaai/stimulus_calendar/style.css"

const app = Application.start()
StimulusCalendar.start(app)                  // registers calendar (+ later: header-toolbar, day-cell, …)
```

`StimulusCalendar.start(app?)` registers all controllers on the given Stimulus
`Application` (or starts a new one) and returns it.

**Option C — Rails / Hotwire (gem from RubyGems).** The
[`stimulus_calendar_rails`](https://rubygems.org/gems/stimulus_calendar_rails)
gem bundles this calendar *and* the live-sync layer, importmap-pinned — no JS
build, no `dist/` to vendor:

```bash
bundle add stimulus_calendar_rails
```

Full setup (importmap, stylesheet, routes, optional migration) is in the
**Rails & Hotwire** section below.

**Option D — clone the repo and run it locally.** Useful for following along
with the port or sending a PR:

```bash
git clone git@github.com:schappim/stimulus_calendar.git
cd stimulus_calendar
npm install
npm run dev                     # open http://localhost:5173/demo/
npm test                        # JS test suite (Vitest)
npm run build:lib               # build dist/stimulus_calendar.js + .esm.js + .css

# Rails companion (once Phase 14 has shipped):
cd gem/demo
bundle install
bin/rails db:setup
bin/rails server                # open http://localhost:3000/calendars
bin/rails test                  # Rails integration tests
```

## Quick start

```html
<link rel="stylesheet" href="dist/stimulus_calendar.css" />

<div data-controller="calendar"
     data-calendar-view-value="timeGridWeek"
     data-calendar-plugins-value='["TimeGrid", "Interaction"]'
     data-calendar-options-value='{
       "events": [
         { "id": "1", "title": "Standup",     "start": "2026-05-25T09:00", "end": "2026-05-25T09:30" },
         { "id": "2", "title": "Design crit", "start": "2026-05-26T14:00", "end": "2026-05-26T15:00" }
       ]
     }'
     style="height: 600px"></div>

<script src="dist/stimulus_calendar.js"></script>
<script>StimulusCalendar.start()</script>
```

Events can be **server-rendered** (passed via `data-calendar-options-value` JSON),
loaded from a **URL** (`data-calendar-event-source-value="/events.json"`), or
mutated in JS via `element.calendarApi.addEvent({…})`.

## Screenshots

> Images land here as each feature ships — see [PLAN.md](./PLAN.md). The
> filenames below are the canonical targets; the dev server + Rails dummy
> app are what they're captured from.

**Month view** — multi-day events span weeks, today is highlighted, week
numbers in the left gutter.

![dayGridMonth view with multi-day events spanning weeks and week numbers in the gutter](docs/images/cal-month.png)

**Week view (TimeGrid)** — sidebar of time slots + day columns, all-day row
across the top, now indicator drawn live.

![timeGridWeek view with hourly slots, an all-day row, and an overlapping morning meeting](docs/images/cal-week.png)

**List view** — chronological list of events grouped by day.

![listWeek view: chronological event list with day headers and event time + title rows](docs/images/cal-list-week.png)

**Resource timeline** — vertical resource axis + horizontal time axis, with
nested expandable resources.

![resourceTimelineWeek view with three top-level resources, one expanded to show two child resources, events laid out on each row](docs/images/cal-resource-timeline-week.png)

**Drag, drop &amp; resize** — pointer-driven edits. With the Rails gem, each
drag PATCHes the server and broadcasts the new times to every other tab.

![Event being dragged in timeGridWeek with a ghost preview and the originating cell dimmed](docs/images/cal-drag.png)

**Live multi-user sync** — Turbo Streams: one user moves an event, every other
connected user sees it move within ~50ms.

![Two browser windows side-by-side showing the same calendar — an event dragged in the left window has just appeared moved in the right window](docs/images/cal-broadcast.png)

## Calendar attributes (`data-calendar-*-value`)

> The full attribute surface is documented per-option in
> [`skills/stimulus-calendar-js/SKILL.md`](skills/stimulus-calendar-js/SKILL.md);
> the table here lists the high-level switches. Rows ship as their matching
> `PLAN.md` checkbox is ticked.

| Attribute | Meaning |
|---|---|
| `view` | initial view: `dayGridMonth`, `timeGridWeek`, `timeGridDay`, `listDay`, `listWeek`, `listMonth`, `listYear`, `resourceTimeGridDay`, `resourceTimeGridWeek`, `resourceTimelineDay`, `resourceTimelineWeek`, `resourceTimelineMonth`, `resourceTimelineYear` |
| `plugins` | JSON array — `"DayGrid"`, `"TimeGrid"`, `"List"`, `"Resource"`, `"ResourceTimeGrid"`, `"ResourceTimeline"`, `"Interaction"` |
| `options` | JSON of the rest of the [vkurko/calendar options](https://github.com/vkurko/calendar#options) (events, locale, headerToolbar, slotDuration, …) |
| `event-source` | URL returning a JSON array of events |
| `resource-source` | URL returning a JSON array of resources |
| `broadcast` | `false`, `"turbo-stream"`, `"action-cable"`, `"websocket"`, `"broadcast-channel"` |
| `broadcast-channel` | channel name / URL for the chosen adapter |

## Events (dispatched on the calendar element)

`calendar:ready` (`detail.api`) · `calendar:datesSet` · `calendar:viewDidMount` ·
`calendar:eventClick` · `calendar:eventMouseEnter` · `calendar:eventMouseLeave` ·
`calendar:eventDrop` (`{event, oldEvent, delta, revert}`) ·
`calendar:eventResize` · `calendar:dateClick` · `calendar:select` ·
`calendar:unselect` · `calendar:broadcast:in` · `calendar:broadcast:out`.

```js
calendar.addEventListener("calendar:ready", (e) => e.detail.api.addEvent({ id: "10", title: "..." }))
calendar.addEventListener("calendar:eventDrop", (e) => save(e.detail))
```

## Public API — `element.calendarApi`

Available after the `calendar:ready` event. Mirrors vkurko/calendar's public
methods one-for-one:

- **Events:** `addEvent`, `updateEvent`, `removeEventById`, `getEvents`,
  `getEventById`, `refetchEvents`
- **Resources:** `refetchResources`
- **Navigation:** `next`, `prev`, `getView`, `dateFromPoint(x, y)`
- **Options:** `setOption(name, value)`, `getOption(name)`
- **Selection:** `unselect()`

```js
const api = document.querySelector('[data-controller~="calendar"]').calendarApi
api.addEvent({ id: "1", title: "Lunch", start: "2026-05-25T12:00", end: "2026-05-25T13:00" })
api.next()
```

## Turbo Streams broadcasting

When one user adds, drags or resizes an event, every other connected user sees
it instantly. **Transport-agnostic** core, with adapters for:

- `turbo-stream` — `<turbo-stream action="calendar-event-{add,update,remove}">` custom actions over Action Cable; the Rails gem (Option C) wires this end-to-end.
- `action-cable` — direct channel subscription, no Turbo Stream wrapper.
- `websocket` — raw WebSocket, server format defined by your app.
- `broadcast-channel` — `window.BroadcastChannel` for tab-to-tab sync within
  a single browser (great for demos, no server needed).

Payload schema and the Rails recipe (`broadcasts_calendar`) are documented in
[`docs/BROADCAST.md`](docs/BROADCAST.md) (lands with Phase 13).

## Rails &amp; Hotwire (`stimulus_calendar_rails`)

For Rails apps, the **[`stimulus_calendar_rails`](gem/stimulus_calendar_rails)**
gem turns the calendar into a **server-driven, multi-user editable** calendar
over Turbo Streams + Action Cable — no React, no client-side scheduling
framework, no JS build step. Because a Rails app knows its schema, the
**server** event definition does the work a generic client calendar pushes
onto the browser: auth, coercion, validation, and broadcasting.

**Capabilities** (target — ships in Phase 14):

- **Live multi-user editing** — every create/update/destroy broadcasts
  `calendar-event-*` Turbo Stream actions to every connected tab.
- **Optimistic edits** — a dragged event applies immediately, then the server
  reconciles (or reverts with errors), with `X-Optimistic-Id` echo-suppression
  for the originator.
- **Server-side event registry** — per-field `type`, `editable` (boolean *or*
  lambda), `validate`, `concurrency`.
- **Concurrency &amp; validation** — version-checked moves (`lock_version`
  → conflict), server-side validation → revert with errors.
- **Multi-tenancy &amp; auth** — tenant-scoped streams (ActsAsTenant), scoped
  row lookups, and auth inherited from your `parent_controller`.

**Install** — published on RubyGems as
[`stimulus_calendar_rails`](https://rubygems.org/gems/stimulus_calendar_rails).
Add it with Bundler:

```bash
bundle add stimulus_calendar_rails
```

```js
// app/javascript/application.js
import "@hotwired/turbo-rails"
import { Application } from "@hotwired/stimulus"
import StimulusCalendar from "stimulus_calendar"
import StimulusCalendarRails from "stimulus_calendar_rails"

const application = Application.start()
StimulusCalendar.start(application)        // calendar (+ header-toolbar, day-cell, …)
StimulusCalendarRails.start(application)   // calendar-sync + Turbo Stream actions
```

```erb
<%# app/views/layouts/application.html.erb (head) %>
<%= stylesheet_link_tag "stimulus_calendar", "stimulus_calendar_rails" %>
<%= javascript_importmap_tags %>
```

```ruby
# config/routes.rb
mount ActionCable.server => "/cable"
mount StimulusCalendarRails::Engine => StimulusCalendarRails.mount_path   # default "/calendars"
```

**Usage**

```ruby
# app/calendars/event_calendar.rb — one source of truth for the schema
class EventCalendar < StimulusCalendarRails::Calendar
  resource :events
  model    Event
  stream_name { |_user| "events" }

  field :title,       type: :string,   editable: true
  field :starts_at,   type: :datetime, editable: true, concurrency: :version_checked
  field :ends_at,     type: :datetime, editable: true, concurrency: :version_checked,
                      validate: ->(v, row) { "end must be after start" if v <= row.starts_at }
  field :resource_id, type: :reference, editable: ->(row, user) { user&.admin? }
end
```

```ruby
# app/models/event.rb — make the model broadcast its changes
class Event < ApplicationRecord
  include StimulusCalendarRails::Broadcastable
  broadcasts_calendar EventCalendar
  self.locking_column = :lock_version   # needed for version-checked fields
end
```

```erb
<%# render it anywhere %>
<%= render partial: "stimulus_calendar_rails/calendars/calendar",
           locals: { calendar: EventCalendar.new(user: current_user),
                     events: Event.between(@start, @end),
                     view: "timeGridWeek" } %>
```

Drag an event → optimistic move → the server persists or reverts → every
other connected tab updates live. A complete runnable app is in
[`gem/demo`](gem/demo); full docs in
[`gem/stimulus_calendar_rails/README.md`](gem/stimulus_calendar_rails/README.md)
and [`RAILS.md`](RAILS.md).

## Demos

`npm install && npx vite`, then open `http://localhost:5173/demo/` — demo
pages cover basics, month/week/list/resource views, drag/drop/resize, and the
two-window BroadcastChannel sync example. Demos land per
[PLAN.md](./PLAN.md) phase.

For the Rails companion, `cd gem/demo && bin/rails server` then open
`http://localhost:3000/calendars`. Open the same URL in a second window and
drag an event — both windows update live.

## Build

```bash
npm run build:lib   # dist/stimulus_calendar.js (IIFE) + dist/stimulus_calendar.esm.js (ESM) + .css
```

## Tests

```bash
npm test                          # JS core (Vitest)
cd gem/demo && bin/rails test     # Rails engine: models, controllers, Turbo Streams broadcasts
```

Both run on every push/PR via [GitHub Actions](.github/workflows/ci.yml).

See [`RAILS.md`](RAILS.md) for the Hotwire-Native build checklist,
[`docs/REFERENCE.md`](docs/REFERENCE.md) for the full programmatic API (lands
in Phase 15), and [`skills/`](skills) for LLM-oriented usage guides.

## License

MIT — see [LICENSE](./LICENSE). Portions ported from
[vkurko/calendar](https://github.com/vkurko/calendar) (MIT).
