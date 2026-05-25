# Migration plan: vkurko/calendar → stimulus_calendar

The goal: a 100% feature-complete Stimulus.js port of
[vkurko/calendar](https://github.com/vkurko/calendar) (v5.7.1), **plus a
first-class Rails companion gem (`stimulus_calendar_rails`)** that mirrors the
shape of [`stimulus_grid_rails`](https://github.com/schappim/stimulus_grid/tree/main/gem/stimulus_grid_rails)
— server-driven event/resource declarations and live multi-user sync over Turbo
Streams + Action Cable.

The upstream Svelte 5 source lives at `./calendar/` (gitignored) and is the
reference implementation we're porting.

## Rules of engagement

- **One commit per unchecked box.** Granularity is per individual option, method
  or feature — small, reviewable, bisectable.
- **Tests run on both sides where they apply.**
  - Pure JS logic → Vitest in `test/` (`npm test`).
  - JS controllers / DOM behaviour → JSDOM Vitest (`npm test`).
  - Rails integration → Minitest in `gem/demo/test/` (`cd gem/demo && bin/rails test`).
  - Any commit that touches the Rails gem OR a JS feature with a Rails-visible
    surface (events, resources, broadcasts, optimistic-id flow) MUST land both
    test types in the same commit.
- **Every user-visible feature ships a demo and a screenshot.**
  - JS-only demos under `demo/NN-…html`, linked from `demo/index.html`.
  - Rails demos under `gem/demo/app/views/…` (e.g. `gem/demo/app/views/calendars/index.html.erb`).
  - The screenshot lives under `docs/images/cal-<feature>.png` and is referenced
    from `README.md` and the matching `skills/*/SKILL.md`. Screenshots are
    captured from the running dev server / Rails app, not faked.
- **Docs grow with the code.** Every commit that adds or changes a public
  surface updates the matching section of:
  - `README.md`
  - `skills/stimulus-calendar-js/SKILL.md` (JS API for LLMs)
  - `skills/stimulus-calendar-rails/SKILL.md` (Rails API for LLMs)
  - `docs/REFERENCE.md` (full programmatic reference) — once it exists (Phase 15)
- **No "and also fixed X" commits.** If unrelated rot needs cleaning, that's a
  separate commit.
- Commit messages: `feat(lib): add date utilities`, `feat(view): dayGridMonth`,
  `feat(opt): hiddenDays`, `feat(broadcast): turbo-stream adapter`,
  `feat(rails): broadcastable concern`, `feat(rails-gem): scaffold engine`,
  `docs(skill): document hiddenDays`, `chore(screenshot): cal-month`.

---

## Phase 0 — JS scaffold

- [x] Project skeleton: `package.json`, `vite.config.js`, `vite.lib.config.js`,
      `vitest.config.js`, `src/{controllers,lib,styles}/`, `test/`, `demo/`,
      `.github/workflows/ci.yml`, `LICENSE`, `.gitignore`
      (excluding `calendar/`), initial PLAN.

---

## Phase 0a — Documentation, skills, gem skeleton, dummy Rails app

These set up the *structure* before features ship. Future per-feature commits
slot content into the existing files rather than inventing new layout each time.

- [x] `README.md` — rewrite to mirror stimulus_grid: badges, hero image,
      install (Option A IIFE / Option B npm / Option C Rails gem), quick start
      with **runnable from-the-repo** instructions, screenshot placeholders,
      attribute tables (filled per-phase), events list, public API, Rails
      section, demos, build, tests, license.
- [x] `docs/images/.gitkeep` — directory exists from day one so per-feature
      screenshots can drop into it without scaffolding noise.
- [x] `skills/stimulus-calendar-js/SKILL.md` — frontmatter + section outline
      (setup, minimal calendar, attributes, events, API, gotchas). Content
      fills in per-feature.
- [x] `skills/stimulus-calendar-rails/SKILL.md` — frontmatter + section
      outline (setup, declaring an EventCalendar, Broadcastable, render
      partial, custom Turbo Stream actions, gotchas).
- [ ] `RAILS.md` — Hotwire-Native Event Calendar build checklist, modeled on
      stimulus_grid's `RAILS.md`. Per-section checkboxes that flip ticked as
      Phase 14 ships.
- [ ] `gem/stimulus_calendar_rails/` — bare engine skeleton: `gemspec`,
      `lib/stimulus_calendar_rails.rb`, `lib/stimulus_calendar_rails/version.rb`,
      `lib/stimulus_calendar_rails/engine.rb`, `config/importmap.rb`,
      `config/routes.rb`, empty `app/{assets,controllers,javascript,models,views}/`
      tree, `MIT-LICENSE`, `Rakefile`, `Gemfile`, `README.md`.
- [ ] `gem/demo/` — dummy Rails app generated with `rails new`, includes the
      gem `path:`-pinned, ActionCable + Turbo + Importmap, an `Event` and
      `Resource` model with migrations, a tiny `calendars#index` view, and
      `bin/rails test` wired up. This is the **real Rails app every Rails
      commit tests against** — never a mock.
- [ ] `.github/workflows/ci.yml` — extend to run `bin/rails test` in
      `gem/demo` alongside `npm test`. Single matrix: node 22 + ruby 3.3.
- [ ] `CHANGELOG.md` — empty, ready for entries.

---

## Phase 1 — Core libraries (pure JS, no DOM)

These mirror `calendar/packages/core/src/lib/` — pure modules under `src/lib/`
with full Vitest coverage. No Stimulus controllers yet. **Rails tests N/A**
(no Rails-visible surface).

- [ ] `lib/utils.js` — `assign`, `keys`, `entries`, `hasOwn`, type guards
      (`isArray`, `isFunction`, `isDate`, `isPlainObject`), `tzOffset`
- [ ] `lib/date.js` — `createDate`, `cloneDate`, `addDuration`,
      `toLocalDate`, `setMidnight`, `prevClosestDay`, `nextDate`, `prevDate`,
      `toSeconds`, `getWeekNumber`, `formatRange`, `parseTimestamp`,
      `datesEqual`, `copyTime`, `setStartOfDay`
- [ ] `lib/duration.js` — `parseDuration` (string `"HH:MM"`, object `{days,…}`,
      seconds), `durationDays`, `durationToSeconds`, `addDurationToDate`
- [ ] `lib/range.js` — `createDateRange`, `datesInRange`, `rangesOverlap`,
      `intersectRanges`
- [ ] `lib/options.js` — `undefinedOr`, per-option setter helper
- [ ] `lib/payload.js` — Symbol-keyed `setPayload` / `getPayload` /
      `hasPayload` on DOM nodes
- [ ] `lib/dom.js` — `createElement`, `rect`, `elementFromPoint` helpers
- [ ] `lib/a11y.js` — keyboard handlers, aria utilities
- [ ] `lib/attachments.js` — `contentFrom` (html / text / dom nodes),
      `outsideEvent` dispatch
- [ ] `lib/events.js` — `createEvents`: parse + normalise input events to
      internal shape, with timezone offset applied
- [ ] `lib/resources.js` — `createResources`: flat & nested input → tree with
      parent linkage and per-node payload
- [ ] `lib/slots.js` — `createSlots`, `createSlotTimeLimits`
- [ ] `lib/chunks.js` — `createEventChunk`, `groupChunks`, column / overlap
      positioning math
- [ ] `lib/view.js` — `createView` factory (start, end, currentStart, currentEnd,
      title, type)
- [ ] `lib/derived.js` — pure helpers behind `currentRange`, `activeRange`,
      `viewDates`, `viewTitle`, `filteredEvents`, `offset`

---

## Phase 2 — State & options store

- [ ] `lib/state.js` — `MainState` class (mutable; controllers subscribe via
      `on(event, fn)`). Replaces Svelte runes with a plain pub/sub model.
- [ ] `lib/options_store.js` — option defaults table, per-view override merge,
      `setOption` / `getOption`, parsers registry
- [ ] `lib/plugins.js` — plugin registration: `createOptions`, `createParsers`,
      `initState`, view registry
- [ ] Effects model — when state changes, recompute derived state, dispatch
      `change:<name>` events to subscribers

---

## Phase 3 — Calendar controller + global options

Each option commit lands JS test, demo update, and (once Phase 0a ships) a
matching ERB usage example in `gem/demo` if the option is server-renderable.

- [ ] `controllers/calendar_controller.js` — full lifecycle:
      `connect`, `disconnect`, mount root DOM (`.ec`, toolbar slot, view slot),
      expose instance API on `this`
- [ ] Option: `date`
- [ ] Option: `duration`
- [ ] Option: `dateIncrement`
- [ ] Option: `firstDay`
- [ ] Option: `hiddenDays`
- [ ] Option: `validRange`
- [ ] Option: `height`
- [ ] Option: `theme` (class object)
- [ ] Option: `locale`
- [ ] Option: `timeZone`
- [ ] Option: `customScrollbars`
- [ ] Option: `view`
- [ ] Option: `views` (per-view overrides)
- [ ] Option: `viewDidMount`
- [ ] Option: `datesSet`
- [ ] Option: `loading`
- [ ] Option: `lazyFetching`
- [ ] Option: `highlightedDates`
- [ ] Option: `titleFormat`
- [ ] Option: `dayHeaderFormat`
- [ ] Option: `dayHeaderAriaLabelFormat`
- [ ] Option: `icons`
- [ ] Option: `buttonText`
- [ ] Option: `customButtons`
- [ ] Option: `headerToolbar`

---

## Phase 4 — Toolbar

- [ ] Title rendering (uses `titleFormat` against active range) + screenshot
      `docs/images/cal-toolbar-title.png`
- [ ] `prev` button + click behaviour
- [ ] `next` button + click behaviour
- [ ] `today` button + click behaviour
- [ ] View switcher buttons (one per registered view name)
- [ ] `customButtons` rendering and click dispatch
- [ ] `headerToolbar` slot layout (`start` / `center` / `end`)
- [ ] Disabled state on prev/next when bounded by `validRange`

---

## Phase 5 — DayGrid view (month / week / day)

Each view-introducing commit ships a `docs/images/cal-<view>.png` screenshot.

- [ ] View skeleton: `dayGridMonth` — weeks × days CSS grid → `cal-month.png`
- [ ] View: `dayGridWeek` → `cal-day-grid-week.png`
- [ ] View: `dayGridDay` → `cal-day-grid-day.png`
- [ ] Day cell rendering: `day`, `today` highlight, other-month dimming
- [ ] Option: `dayCellFormat`
- [ ] Option: `dayCellContent`
- [ ] Event rendering inside day cells (dot + title + time)
- [ ] Option: `dayMaxEvents` — collapse with "+N more" link
- [ ] Option: `moreLinkContent`
- [ ] Day popover when "+N more" clicked → `cal-popover.png`
- [ ] Option: `dayPopoverFormat`
- [ ] Option: `weekNumbers`
- [ ] Option: `weekNumberContent`

---

## Phase 6 — TimeGrid view (week / day with slots)

- [ ] View: `timeGridWeek` — sidebar + day columns + slot grid → `cal-week.png`
- [ ] View: `timeGridDay` → `cal-day.png`
- [ ] Slot rendering and labels
- [ ] All-day row
- [ ] Option: `allDaySlot`
- [ ] Option: `allDayContent`
- [ ] Option: `scrollTime`
- [ ] Option: `slotDuration`
- [ ] Option: `slotHeight`
- [ ] Option: `slotLabelInterval`
- [ ] Option: `slotLabelFormat`
- [ ] Option: `slotMinTime`
- [ ] Option: `slotMaxTime`
- [ ] Option: `flexibleSlotTimeLimits`
- [ ] Option: `slotEventOverlap`
- [ ] Option: `columnWidth`
- [ ] Now indicator (horizontal red line) → `cal-now-indicator.png`
- [ ] Option: `nowIndicator`

---

## Phase 7 — List view

- [ ] View: `listDay` → `cal-list-day.png`
- [ ] View: `listWeek` → `cal-list-week.png`
- [ ] View: `listMonth`
- [ ] View: `listYear`
- [ ] Option: `listDayFormat`
- [ ] Option: `listDaySideFormat`
- [ ] Option: `noEventsContent`
- [ ] Option: `noEventsClick`

---

## Phase 8 — Resources + ResourceTimeGrid

- [ ] Option: `resources` (flat array)
- [ ] Option: `resources` (function / event-source style with `refetch`)
- [ ] Nested resources (`children`)
- [ ] Option: `refetchResourcesOnNavigate`
- [ ] View: `resourceTimeGridDay` → `cal-resource-time-grid.png`
- [ ] View: `resourceTimeGridWeek`
- [ ] Option: `datesAboveResources`
- [ ] Option: `resourceLabelContent`
- [ ] Option: `resourceLabelDidMount`
- [ ] Option: `filterResourcesWithEvents`
- [ ] Option: `filterEventsWithResources`

---

## Phase 9 — ResourceTimeline

- [ ] View: `resourceTimelineDay` → `cal-resource-timeline-day.png`
- [ ] View: `resourceTimelineWeek` → `cal-resource-timeline-week.png`
- [ ] View: `resourceTimelineMonth`
- [ ] View: `resourceTimelineYear`
- [ ] Option: `monthHeaderFormat`
- [ ] Option: `slotWidth`
- [ ] Option: `resourceExpand` (expand/collapse nested rows)
- [ ] Now indicator (vertical line)

---

## Phase 10 — Events surface (cross-view)

From here on every commit lands a JS test AND a Rails integration test in
`gem/demo` (the Rails app's `Event` model is the test fixture).

- [ ] Option: `events` (static array) — JS + Rails: render an `Event.all` array
      into the calendar partial
- [ ] Option: `eventSources` (array of sources — array, function, URL) — Rails:
      JSON endpoint backed by `Event.between(start, end)`
- [ ] Option: `eventFilter`
- [ ] Option: `eventOrder`
- [ ] Option: `eventColor`
- [ ] Option: `eventBackgroundColor`
- [ ] Option: `eventTextColor`
- [ ] Option: `eventClassNames`
- [ ] Option: `eventContent`
- [ ] Option: `eventDidMount`
- [ ] Option: `eventTimeFormat`
- [ ] Option: `displayEventEnd`
- [ ] Option: `eventClick`
- [ ] Option: `eventMouseEnter`
- [ ] Option: `eventMouseLeave`
- [ ] Option: `eventAllUpdated`
- [ ] Background events (`display: 'background'`)

---

## Phase 11 — Interaction plugin

- [ ] `pointer` enable + cursor styling
- [ ] Option: `dateClick`
- [ ] Option: `editable` (master switch)
- [ ] Option: `eventStartEditable`
- [ ] Option: `eventDurationEditable`
- [ ] Drag: `eventDragStart`
- [ ] Drag: `eventDragStop`
- [ ] Drag: `eventDrop` → screenshot `cal-drag.png` + Rails test: drop fires
      PATCH /events/:id, model save, broadcast back to other tabs
- [ ] Option: `eventDragMinDistance`
- [ ] Option: `eventLongPressDelay`
- [ ] Option: `dragConstraint`
- [ ] Option: `dragScroll`
- [ ] Resize handles + rendering
- [ ] Resize: `eventResizeStart`
- [ ] Resize: `eventResizeStop`
- [ ] Resize: `eventResize` → Rails test: resize persists end-time, broadcasts
- [ ] Option: `eventResizableFromStart`
- [ ] Option: `resizeConstraint`
- [ ] Option: `snapDuration`
- [ ] Option: `selectable` (selection mode)
- [ ] Option: `select`
- [ ] Option: `unselect`
- [ ] Option: `unselectAuto`
- [ ] Option: `unselectCancel`
- [ ] Option: `selectBackgroundColor`
- [ ] Option: `selectConstraint`
- [ ] Option: `selectMinDistance`
- [ ] Option: `selectLongPressDelay`
- [ ] Option: `longPressDelay`

---

## Phase 12 — Public instance methods

- [ ] `setOption(name, value)`
- [ ] `getOption(name)`
- [ ] `addEvent(event)` → Rails test: `POST /events` round-trips into the calendar
- [ ] `updateEvent(event)` → Rails test: `PATCH /events/:id` round-trips
- [ ] `removeEventById(id)` → Rails test: `DELETE /events/:id` round-trips
- [ ] `getEvents()`
- [ ] `getEventById(id)`
- [ ] `refetchEvents()` → Rails test: re-fetch from JSON endpoint
- [ ] `refetchResources()` → Rails test: re-fetch from JSON endpoint
- [ ] `getView()`
- [ ] `next()`
- [ ] `prev()`
- [ ] `unselect()`
- [ ] `dateFromPoint(x, y)`
- [ ] IIFE convenience: `EventCalendar.create` / `EventCalendar.destroy`

---

## Phase 13 — JS broadcast core *(transport-agnostic; ships in `src/`)*

Goal: when one user mutates the calendar, every other connected user sees the
change live. The JS core does the dispatching; the Rails companion gem
(Phase 14) provides the server-side broadcast pipeline + custom Turbo Stream
actions.

- [ ] Core: `lib/broadcast/bus.js` — `BroadcastBus` (subscribe / publish, JSON
      message format with `op`, `event`, `meta`, `origin`)
- [ ] Wire outbound: dispatch on `addEvent` / `updateEvent` / `removeEventById`
- [ ] Wire outbound: dispatch on interaction outputs (`eventDrop`, `eventResize`)
- [ ] Wire inbound: bus → calendar mutation (origin tag prevents echo loops)
- [ ] Conflict policy: last-write-wins by event ID; expose `broadcastResolve`
      callback to let consumers override
- [ ] Adapter: `lib/broadcast/turbo_stream.js` —
      `<turbo-stream action="calendar-event">` custom action
- [ ] Adapter: `lib/broadcast/action_cable.js` — subscribe a channel + relay
- [ ] Adapter: `lib/broadcast/websocket.js` — raw WebSocket wrapper
- [ ] Adapter: `lib/broadcast/broadcast_channel.js` — `BroadcastChannel` API
      (for tab-to-tab demo without a server)
- [ ] Option: `broadcast` (`false` | `'turbo-stream'` | `'action-cable'` |
      `'websocket'` | `'broadcast-channel'` | adapter instance)
- [ ] Option: `broadcastChannel` (channel name / URL)
- [ ] Option: `broadcastFilter` (decide which local mutations to send)
- [ ] Demo: two browser windows synced via `BroadcastChannel` (no server) →
      screenshot `cal-broadcast-channel.gif`
- [ ] Docs: `docs/BROADCAST.md` — payload schema, Rails recipe with
      `Turbo::StreamsChannel.broadcast_action_to(...)`

---

## Phase 14 — Rails companion gem `stimulus_calendar_rails`

Mirrors `gem/stimulus_grid_rails`'s shape exactly (engine, declarative
DSL, Broadcastable concern, custom Turbo Stream actions, controllers, view
partial, importmap pins, asset pipeline, dummy Rails app integration tests).

Every commit in this phase lands matching tests in `gem/demo/test/`.

### 14a — Engine internals

- [ ] `lib/stimulus_calendar_rails.rb` — module roots, `parent_controller=`,
      `mount_path=`, per-process registry (`register_calendar` / `lookup_calendar`),
      `tenant_stream_token`, `streamables_for`
- [ ] `lib/stimulus_calendar_rails/version.rb`
- [ ] `lib/stimulus_calendar_rails/engine.rb` — asset precompile, importmap
      paths, append view path
- [ ] `config/importmap.rb` — pin `stimulus_calendar`, `stimulus_calendar_rails`
- [ ] `config/routes.rb` — `/events/*`, `/resources/*`, `/calendars/:resource/events/:id`
- [ ] `app/assets/javascripts/stimulus_calendar.js` — vendor the IIFE bundle
- [ ] `app/assets/javascripts/stimulus_calendar_rails.js` — Stimulus controllers
      + `registerStreamActions` for the custom calendar Turbo Stream actions
- [ ] `app/assets/stylesheets/stimulus_calendar.css` + `…_rails.css`

### 14b — Server-side declarative DSL

- [ ] `lib/stimulus_calendar_rails/calendar.rb` — base class:
      `resource :events`, `model Event`, `field :title`, `field :starts_at`,
      `field :ends_at`, `field :resource_id`, `scope(user)`, `event_to_h(row)`
- [ ] `lib/stimulus_calendar_rails/field.rb` — per-field declaration
      (`type:`, `editable:`, `validate:`, `concurrency:`)
- [ ] `lib/stimulus_calendar_rails/resource_set.rb` — declare resource columns,
      flat or nested
- [ ] Per-field `editable_for?(row, user)` + server-side coercion + validation
      (mirror `Column#coerce` / `Column#validate`)

### 14c — Custom Turbo Stream actions

- [ ] `lib/stimulus_calendar_rails/turbo_streams_helper.rb` —
- [ ] `calendar-event-add` — insert one event by id
- [ ] `calendar-event-update` — patch one event's fields by id
- [ ] `calendar-event-remove` — delete one event by id
- [ ] `calendar-resource-add` / `…-update` / `…-remove`
- [ ] `calendar-source-refetch` — tell client to refetch an event source
- [ ] `calendar-bulk` — atomic batched stream
- [ ] `calendar-conflict` — server vs client value conflict (e.g.
      version-checked move)

### 14d — Broadcastable model concern

- [ ] `lib/stimulus_calendar_rails/concerns/broadcastable.rb` —
      `broadcasts_calendar EventCalendar`; after_create / after_update /
      after_destroy commit callbacks generate `calendar-event-add/update/remove`
      messages, tenant-scoped via `streamables_for`
- [ ] Test (`gem/demo/test/models/event_broadcast_test.rb`): create → broadcast,
      update → broadcast, destroy → broadcast, ActsAsTenant isolation

### 14e — Controllers

- [ ] `BaseController` (inherits from `StimulusCalendarRails.parent_controller`)
- [ ] `EventsController#index` — JSON list scoped by `?start=&end=`
- [ ] `EventsController#create` — accept `optimistic_id`, persist, rely on
      Broadcastable to broadcast
- [ ] `EventsController#update` — drag/drop/resize destination; same optimistic-id
      pattern as stimulus_grid's cell endpoint
- [ ] `EventsController#destroy`
- [ ] `ResourcesController#index` — JSON list
- [ ] Controller integration tests in `gem/demo/test/integration/`

### 14f — View partial

- [ ] `app/views/stimulus_calendar_rails/calendars/_calendar.html.erb` —
      renders the `.ec` container with all `data-controller="calendar"` value
      attributes derived from the calendar class + locals, plus
      `<%= turbo_stream_from(*StimulusCalendarRails.streamables_for(resource)) %>`
- [ ] Helper module for `data-*` value attribute serialisation

### 14g — Dummy Rails app exercise (`gem/demo`)

- [ ] `app/models/event.rb` — include `Broadcastable`, `broadcasts_calendar
      EventCalendar`, validates
- [ ] `app/models/resource.rb`
- [ ] `app/calendars/event_calendar.rb` — declare fields + scope
- [ ] `app/controllers/calendars_controller.rb#index` — render the partial
- [ ] `db/migrate/…create_events.rb`, `…create_resources.rb`
- [ ] Fixtures or factory helper in `test/test_helper.rb`
- [ ] System test: drag an event → other tab updates (using
      `capybara-action-cable` style assertion)

### 14h — Concurrency + conflicts

- [ ] Per-field `concurrency: :version_checked` honoring `lock_version`
- [ ] `calendar-conflict` broadcast on stale write
- [ ] `gem/demo` integration test: stale move → conflict, fresh move → succeed

### 14i — Multi-tenant + auth

- [ ] `parent_controller` config respected by all gem controllers
- [ ] ActsAsTenant scoping in `streamables_for`
- [ ] `gem/demo` test: tenant A's broadcast never reaches tenant B

### 14j — Release prep for the gem

- [ ] `gem/stimulus_calendar_rails/README.md` (gem-specific quick start)
- [ ] `gem/stimulus_calendar_rails/CHANGELOG.md`
- [ ] `bin/rails stimulus_calendar_rails:install:migrations` task
- [ ] `gem build stimulus_calendar_rails.gemspec` smoke step in CI

---

## Phase 15 — Cross-cutting docs & polish

- [ ] Accessibility audit: aria roles per view, keyboard nav, focus management
- [ ] Mobile touch behaviour (long-press, scroll-vs-drag)
- [ ] Dark mode (`ec-dark` class) — match upstream demo
- [ ] Locale pack examples (en, fr, de, es, ja, …) using `Intl`
- [ ] Timezone support via `Intl.DateTimeFormat` with named TZ
- [ ] Performance pass: virtualise long event lists in list / timeline views
- [ ] Browser support matrix in README
- [ ] `docs/REFERENCE.md` — full programmatic JS API reference
- [ ] `docs/RAILS_REFERENCE.md` — full server-side `Calendar` / `Field` / DSL
      reference
- [ ] `skills/stimulus-calendar-js/SKILL.md` — final pass for LLM usage
- [ ] `skills/stimulus-calendar-rails/SKILL.md` — final pass
- [ ] `README.md` — full screenshots filled in (no placeholders remaining)
- [ ] `CHANGELOG.md` — 0.1.0 entry

---

## Phase 16 — Release

- [ ] CI: lint step (eslint + rubocop in gem/demo) added
- [ ] npm publish prep (`prepublishOnly`, `files` whitelist verified)
- [ ] CDN bundle smoke test (`dist/stimulus_calendar.js` in a plain HTML page)
- [ ] `gem build` + RubyGems publish (`stimulus_calendar_rails-0.1.0.gem`)
- [ ] Tag `0.1.0` and write release notes
- [ ] Verify install paths in fresh sandboxes:
      `npm i @ninjaai/stimulus_calendar` and `bundle add stimulus_calendar_rails`

---

## Progress counter

When a phase is fully done, tick it here too — gives an at-a-glance view in
the GitHub repo without expanding every section.

- [x] Phase 0 — JS scaffold
- [ ] Phase 0a — Documentation, skills, gem skeleton, dummy Rails app
- [ ] Phase 1 — Core libraries
- [ ] Phase 2 — State & options
- [ ] Phase 3 — Calendar controller + global options
- [ ] Phase 4 — Toolbar
- [ ] Phase 5 — DayGrid view
- [ ] Phase 6 — TimeGrid view
- [ ] Phase 7 — List view
- [ ] Phase 8 — Resources + ResourceTimeGrid
- [ ] Phase 9 — ResourceTimeline
- [ ] Phase 10 — Events surface
- [ ] Phase 11 — Interaction plugin
- [ ] Phase 12 — Public methods
- [ ] Phase 13 — JS broadcast core
- [ ] Phase 14 — Rails companion gem `stimulus_calendar_rails`
- [ ] Phase 15 — Cross-cutting docs & polish
- [ ] Phase 16 — Release
