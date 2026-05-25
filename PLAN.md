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
- [x] `RAILS.md` — Hotwire-Native Event Calendar build checklist, modeled on
      stimulus_grid's `RAILS.md`. Per-section checkboxes that flip ticked as
      Phase 14 ships.
- [x] `gem/stimulus_calendar_rails/` — bare engine skeleton: `gemspec`,
      `lib/stimulus_calendar_rails.rb`, `lib/stimulus_calendar_rails/version.rb`,
      `lib/stimulus_calendar_rails/engine.rb`, `config/importmap.rb`,
      `config/routes.rb`, empty `app/{assets,controllers,javascript,models,views}/`
      tree, `MIT-LICENSE`, `Rakefile`, `Gemfile`, `README.md`.
- [x] `gem/demo/` — dummy Rails app generated with `rails new`, includes the
      gem `path:`-pinned, ActionCable + Turbo + Importmap, an `Event` and
      `Resource` model with migrations, a tiny `calendars#index` view, and
      `bin/rails test` wired up. This is the **real Rails app every Rails
      commit tests against** — never a mock.
- [x] `.github/workflows/ci.yml` — extend to run `bin/rails test` in
      `gem/demo` alongside `npm test`. Single matrix: node 22 + ruby 3.3.
- [x] `CHANGELOG.md` — empty, ready for entries.

---

## Phase 1 — Core libraries (pure JS, no DOM)

These mirror `calendar/packages/core/src/lib/` — pure modules under `src/lib/`
with full Vitest coverage. No Stimulus controllers yet. **Rails tests N/A**
(no Rails-visible surface).

- [x] `lib/utils.js` — `assign`, `keys`, `entries`, `hasOwn`, type guards
      (`isArray`, `isFunction`, `isDate`, `isPlainObject`), `tzOffset`
- [x] `lib/date.js` — `createDate`, `cloneDate`, `addDuration`,
      `toLocalDate`, `setMidnight`, `prevClosestDay`, `nextDate`, `prevDate`,
      `toSeconds`, `getWeekNumber`, `parseTimestamp` (alias), `datesEqual`,
      `copyTime`, `setStartOfDay` (alias). `formatRange` deferred to the
      Intl helpers module.
- [x] `lib/duration.js` — `parseDuration` (string `"HH:MM"`, object `{days,…}`,
      seconds), `durationDays`, `durationToSeconds`, `addDurationToDate`
- [x] `lib/range.js` — `createDateRange`, `datesInRange`, `rangesOverlap`,
      `intersectRanges` (+ `outsideRange` / `dateInRange` from upstream)
- [x] `lib/options.js` — `undefinedOr`, per-option setter helper
      (+ upstream `btnTextDay/Week/Month/Year`, `themeView`)
- [x] `lib/payload.js` — Symbol-keyed `setPayload` / `getPayload` /
      `hasPayload` on any object (DOM nodes, events, resources, chunks)
- [x] `lib/dom.js` — `createElement`, `rect`, `elementFromPoint`, `ancestor`,
      `height`, `getElementWithPayload` (with shadow-root walk), `listen`,
      `stopPropagation`, `isRtl` (hoisted from utils.js)
- [x] `lib/a11y.js` — `keyEnter` (Enter + Space → click semantics with
      preventDefault on Space to suppress the page-scroll)
- [x] `lib/attachments.js` — `contentFrom` (html / text / dom nodes),
      `outsideEvent` dispatch, `resizeObserver`, `intersectionObserver`
- [x] `lib/events.js` — `createEvents` (id coercion, allDay inference,
      allDay end-bump, resourceIds normalisation, color/backgroundColor
      fallback), `createEventSources` (url trim, method upcase),
      `cloneEvent` / `toEventWithLocalDates`, `runReposition`,
      `eventIntersects`, display-type predicates
      (`bgEvent` / `previewEvent` / `ghostEvent` / `pointerEvent` /
      `helperEvent`), `createTimeElement`. `createEventContent` /
      `createEventClasses` land alongside `view.js`.
- [x] `lib/resources.js` — `createResources` (DFS flatten, per-node
      payload of {level, children, hidden}), `createResource` (id coerce,
      defaults), `eventBackgroundColor` / `eventTextColor` /
      `findFirstResource` helpers
- [x] `lib/slots.js` — `createSlots` (time-axis label list with periodicity,
      trailing-span fix), `createSlotTimeLimits` (flexible expansion to fit
      out-of-bounds events, optional `eventFilter`)
- [x] `lib/chunks.js` — `createEventChunk`, `createAllDayChunks`,
      `prepareAllDayChunks` (prev + long maps for stacking),
      `repositionEvent` (overlap-aware vertical layout), `assignChunkId`
      (WeakMap-backed stable ids across re-renders)
- [x] `lib/view.js` — `createView` factory (type, title, currentStart/End,
      activeStart/End, calendar), `toViewWithLocalDates` (public-API clone)
- [x] `lib/derived.js` — pure helpers behind `currentRange`, `activeRange`,
      `viewDates`, `viewTitle`, `filteredEvents`, `offset`, `view`, plus the
      `intl` / `intlRange` Intl wrappers (with iOS<16 ordering fix)

---

## Phase 2 — State & options store

- [x] `lib/state.js` — `MainState` class (mutable; controllers subscribe via
      `on(event, fn)` / `onAny(fn)`). Replaces Svelte runes with a plain
      pub/sub model. `set` short-circuits when value didn't change; `assign`
      dispatches one change at a time; `destroy` clears subscribers + data.
- [x] `lib/options_store.js` — `createOptionsStore` (base defaults + plugin
      contributions, per-view override merge, parsers registry, function-
      mergeable options receive prev value), `setOption` / `setViewOptions`,
      `diff(current, prev)`
- [x] `lib/plugins.js` — `createPluginState(plugins, userOptions)` glues
      options_store + state and invokes `plugin.initState(state)` for each;
      `isPlugin` / `normalisePlugins` validation helpers.
- [x] Effects model — `lib/effects.js`: `installEffects(state, effects[])`
      runs each effect once + on each dep change, with teardown chaining.
      Effect factories: `switchViewEffect`, `datesSetEffect`,
      `viewDidMountEffect`, `eventAllUpdatedEffect`, `nowAndTodayEffect`,
      `timeZoneChangeEffect`, `createLoadingInvoker`. `loadEvents` /
      `loadResources` (fetch) deferred to Phase 10.

---

## Phase 3 — Calendar controller + global options

Each option commit lands JS test, demo update, and (once Phase 0a ships) a
matching ERB usage example in `gem/demo` if the option is server-renderable.

- [x] `controllers/calendar_controller.js` — full lifecycle:
      `connect`, `disconnect`, mount root DOM (`.ec`, toolbar slot, view slot),
      expose instance API on `element.calendarApi`, fire `calendar:ready`,
      derivation pipeline (currentRange → activeRange → viewDates → offset →
      view → filteredEvents), default parsers wired into options_store so
      duration is always normalised before reaching `addDuration`.
- [x] Option: `date`
- [x] Option: `duration`
- [x] Option: `dateIncrement`
- [x] Option: `firstDay`
- [x] Option: `hiddenDays`
- [x] Option: `validRange`
- [x] Option: `height`
- [x] Option: `theme` (class object)
- [x] Option: `locale`
- [x] Option: `timeZone`
- [x] Option: `customScrollbars`
- [x] Option: `view`
- [x] Option: `views` (per-view overrides)
- [x] Option: `viewDidMount`
- [x] Option: `datesSet`
- [x] Option: `loading`
- [x] Option: `lazyFetching`
- [x] Option: `highlightedDates`
- [x] Option: `titleFormat`
- [x] Option: `dayHeaderFormat`
- [x] Option: `dayHeaderAriaLabelFormat`
- [x] Option: `icons`
- [x] Option: `buttonText`
- [x] Option: `customButtons`
- [x] Option: `headerToolbar`

---

## Phase 4 — Toolbar

- [x] Title rendering (uses `titleFormat` against active range) + screenshot
      `docs/images/cal-toolbar-title.png`
- [x] `prev` button + click behaviour
- [x] `next` button + click behaviour
- [x] `today` button + click behaviour
- [x] View switcher buttons (one per registered view name)
- [x] `customButtons` rendering and click dispatch
- [x] `headerToolbar` slot layout (`start` / `center` / `end`)
- [x] Disabled state on prev/next when bounded by `validRange`

---

## Phase 5 — DayGrid view (month / week / day)

Each view-introducing commit ships a `docs/images/cal-<view>.png` screenshot.

- [x] View skeleton: `dayGridMonth` — weeks × days CSS grid → `cal-month.png`
- [x] View: `dayGridWeek` → `cal-day-grid-week.png`
- [x] View: `dayGridDay` → `cal-day-grid-day.png`
- [x] Day cell rendering: `day`, `today` highlight, other-month dimming
- [x] Option: `dayCellFormat`
- [x] Option: `dayCellContent`
- [x] Event rendering inside day cells (dot + title + time)
- [x] Option: `dayMaxEvents` — number caps visible events per cell; overflow becomes "+N more"
- [x] Option: `moreLinkContent`
- [x] Day popover when "+N more" clicked → `cal-popover.png`
- [x] Option: `dayPopoverFormat`
- [x] Option: `weekNumbers`
- [x] Option: `weekNumberContent`

---

## Phase 6 — TimeGrid view (week / day with slots)

- [x] View: `timeGridWeek` — sidebar + day columns + slot grid → `cal-week.png`
- [x] View: `timeGridDay` → `cal-day.png`
- [x] Slot rendering and labels
- [x] All-day row
- [x] Option: `allDaySlot`
- [x] Option: `allDayContent`
- [x] Option: `scrollTime`
- [x] Option: `slotDuration`
- [x] Option: `slotHeight`
- [x] Option: `slotLabelInterval`
- [x] Option: `slotLabelFormat`
- [x] Option: `slotMinTime`
- [x] Option: `slotMaxTime`
- [x] Option: `flexibleSlotTimeLimits`
- [x] Option: `slotEventOverlap`
- [x] Option: `columnWidth`
- [x] Now indicator (horizontal red line) → `cal-now-indicator.png`
- [x] Option: `nowIndicator`

---

## Phase 7 — List view

- [x] View: `listDay` → `cal-list-day.png`
- [x] View: `listWeek` → `cal-list-week.png`
- [x] View: `listMonth`
- [x] View: `listYear`
- [x] Option: `listDayFormat`
- [x] Option: `listDaySideFormat`
- [x] Option: `noEventsContent`
- [x] Option: `noEventsClick`

---

## Phase 8 — Resources + ResourceTimeGrid

- [x] Option: `resources` (flat array)
- [x] Option: `resources` (function / event-source style with `refetch`)
- [x] Nested resources (`children`)
- [x] Option: `refetchResourcesOnNavigate`
- [x] View: `resourceTimeGridDay` → `cal-resource-time-grid.png`
- [x] View: `resourceTimeGridWeek`
- [x] Option: `datesAboveResources`
- [x] Option: `resourceLabelContent`
- [x] Option: `resourceLabelDidMount`
- [x] Option: `filterResourcesWithEvents`
- [x] Option: `filterEventsWithResources`

---

## Phase 9 — ResourceTimeline

- [x] View: `resourceTimelineDay` → `cal-resource-timeline-day.png`
- [x] View: `resourceTimelineWeek` → `cal-resource-timeline-week.png`
- [x] View: `resourceTimelineMonth`
- [x] View: `resourceTimelineYear`
- [x] Option: `monthHeaderFormat`
- [x] Option: `slotWidth`
- [x] Option: `resourceExpand` (expand/collapse nested rows)
- [x] Now indicator (vertical line)

---

## Phase 10 — Events surface (cross-view)

From here on every commit lands a JS test AND a Rails integration test in
`gem/demo` (the Rails app's `Event` model is the test fixture).

- [x] Option: `events` (static array) — JS + Rails: render an `Event.all` array
      into the calendar partial
- [x] Option: `eventSources` (array of sources — array, function, URL) — Rails:
      JSON endpoint backed by `Event.between(start, end)`
- [x] Option: `eventFilter`
- [x] Option: `eventOrder`
- [x] Option: `eventColor`
- [x] Option: `eventBackgroundColor`
- [x] Option: `eventTextColor`
- [x] Option: `eventClassNames`
- [x] Option: `eventContent`
- [x] Option: `eventDidMount`
- [x] Option: `eventTimeFormat`
- [x] Option: `displayEventEnd`
- [x] Option: `eventClick`
- [x] Option: `eventMouseEnter`
- [x] Option: `eventMouseLeave`
- [x] Option: `eventAllUpdated`
- [x] Background events (`display: 'background'`)

---

## Phase 11 — Interaction plugin

- [x] `pointer` enable + cursor styling
- [x] Option: `dateClick`
- [x] Option: `editable` (master switch)
- [x] Option: `eventStartEditable`
- [x] Option: `eventDurationEditable`
- [x] Drag: `eventDragStart`
- [x] Drag: `eventDragStop`
- [x] Drag: `eventDrop` → screenshot `cal-drag.png` + Rails test: drop fires
      PATCH /events/:id, model save, broadcast back to other tabs
- [x] Option: `eventDragMinDistance`
- [x] Option: `eventLongPressDelay`
- [x] Option: `dragConstraint`
- [x] Option: `dragScroll`
- [x] Resize handles + rendering
- [x] Resize: `eventResizeStart`
- [x] Resize: `eventResizeStop`
- [x] Resize: `eventResize` → Rails test: resize persists end-time, broadcasts
- [x] Option: `eventResizableFromStart`
- [x] Option: `resizeConstraint`
- [x] Option: `snapDuration`
- [x] Option: `selectable` (selection mode)
- [x] Option: `select`
- [x] Option: `unselect`
- [x] Option: `unselectAuto`
- [x] Option: `unselectCancel`
- [x] Option: `selectBackgroundColor`
- [x] Option: `selectConstraint`
- [x] Option: `selectMinDistance`
- [x] Option: `selectLongPressDelay`
- [x] Option: `longPressDelay`

---

## Phase 12 — Public instance methods

- [x] `setOption(name, value)`
- [x] `getOption(name)`
- [x] `addEvent(event)` → Rails test: `POST /events` round-trips into the calendar
- [x] `updateEvent(event)` → Rails test: `PATCH /events/:id` round-trips
- [x] `removeEventById(id)` → Rails test: `DELETE /events/:id` round-trips
- [x] `getEvents()`
- [x] `getEventById(id)`
- [x] `refetchEvents()` → Rails test: re-fetch from JSON endpoint
- [x] `refetchResources()` → Rails test: re-fetch from JSON endpoint
- [x] `getView()`
- [x] `next()`
- [x] `prev()`
- [x] `unselect()`
- [x] `dateFromPoint(x, y)`
- [x] IIFE convenience: `EventCalendar.create` / `EventCalendar.destroy`

---

## Phase 13 — JS broadcast core *(transport-agnostic; ships in `src/`)*

Goal: when one user mutates the calendar, every other connected user sees the
change live. The JS core does the dispatching; the Rails companion gem
(Phase 14) provides the server-side broadcast pipeline + custom Turbo Stream
actions.

- [x] Core: `lib/broadcast/bus.js` — `BroadcastBus` (subscribe / publish, JSON
      message format with `op`, `event`, `meta`, `origin`)
- [x] Wire outbound: dispatch on `addEvent` / `updateEvent` / `removeEventById`
- [x] Wire outbound: dispatch on interaction outputs (`eventDrop`, `eventResize`)
- [x] Wire inbound: bus → calendar mutation (origin tag prevents echo loops)
- [x] Conflict policy: last-write-wins by event ID; expose `broadcastResolve`
      callback to let consumers override
- [x] Adapter: `lib/broadcast/turbo_stream.js` —
      `<turbo-stream action="calendar-event">` custom action
- [x] Adapter: `lib/broadcast/action_cable.js` — subscribe a channel + relay
- [x] Adapter: `lib/broadcast/websocket.js` — raw WebSocket wrapper
- [x] Adapter: `lib/broadcast/broadcast_channel.js` — `BroadcastChannel` API
      (for tab-to-tab demo without a server)
- [x] Option: `broadcast` (`false` | `'turbo-stream'` | `'action-cable'` |
      `'websocket'` | `'broadcast-channel'` | adapter instance)
- [x] Option: `broadcastChannel` (channel name / URL)
- [x] Option: `broadcastFilter` (decide which local mutations to send)
- [x] Demo: two browser windows synced via `BroadcastChannel` (no server) →
      screenshot `cal-broadcast-channel.gif`
- [x] Docs: `docs/BROADCAST.md` — payload schema, Rails recipe with
      `Turbo::StreamsChannel.broadcast_action_to(...)`

---

## Phase 14 — Rails companion gem `stimulus_calendar_rails`

Mirrors `gem/stimulus_grid_rails`'s shape exactly (engine, declarative
DSL, Broadcastable concern, custom Turbo Stream actions, controllers, view
partial, importmap pins, asset pipeline, dummy Rails app integration tests).

Every commit in this phase lands matching tests in `gem/demo/test/`.

### 14a — Engine internals

- [x] `lib/stimulus_calendar_rails.rb` — module roots, `parent_controller=`,
      `mount_path=`, per-process registry (`register_calendar` / `lookup_calendar`),
      `tenant_stream_token`, `streamables_for`
- [x] `lib/stimulus_calendar_rails/version.rb`
- [x] `lib/stimulus_calendar_rails/engine.rb` — asset precompile, importmap
      paths, append view path
- [x] `config/importmap.rb` — pin `stimulus_calendar`, `stimulus_calendar_rails`
- [x] `config/routes.rb` — `/events/*`, `/resources/*`, `/calendars/:resource/events/:id`
- [x] `app/assets/javascripts/stimulus_calendar.js` — vendor the IIFE bundle
- [x] `app/assets/javascripts/stimulus_calendar_rails.js` — Stimulus controllers
      + `registerStreamActions` for the custom calendar Turbo Stream actions
- [x] `app/assets/stylesheets/stimulus_calendar.css` + `…_rails.css`

### 14b — Server-side declarative DSL

- [x] `lib/stimulus_calendar_rails/calendar.rb` — base class:
      `resource :events`, `model Event`, `field :title`, `field :starts_at`,
      `field :ends_at`, `field :resource_id`, `scope(user)`, `event_to_h(row)`
- [x] `lib/stimulus_calendar_rails/field.rb` — per-field declaration
      (`type:`, `editable:`, `validate:`, `concurrency:`)
- [x] `lib/stimulus_calendar_rails/resource_set.rb` — declare resource columns,
      flat or nested
- [x] Per-field `editable_for?(row, user)` + server-side coercion + validation
      (mirror `Column#coerce` / `Column#validate`)

### 14c — Custom Turbo Stream actions

- [x] `lib/stimulus_calendar_rails/turbo_streams_helper.rb` —
- [x] `calendar-event-add` — insert one event by id
- [x] `calendar-event-update` — patch one event's fields by id
- [x] `calendar-event-remove` — delete one event by id
- [x] `calendar-resource-add` / `…-update` / `…-remove`
- [x] `calendar-source-refetch` — tell client to refetch an event source
- [x] `calendar-bulk` — atomic batched stream
- [x] `calendar-conflict` — server vs client value conflict (e.g.
      version-checked move)

### 14d — Broadcastable model concern

- [x] `lib/stimulus_calendar_rails/concerns/broadcastable.rb` —
      `broadcasts_calendar EventCalendar`; after_create / after_update /
      after_destroy commit callbacks generate `calendar-event-add/update/remove`
      messages, tenant-scoped via `streamables_for`
- [x] Test (`gem/demo/test/models/event_broadcast_test.rb`): create → broadcast,
      update → broadcast, destroy → broadcast, ActsAsTenant isolation

### 14e — Controllers

- [x] `BaseController` (inherits from `StimulusCalendarRails.parent_controller`)
- [x] `EventsController#index` — JSON list scoped by `?start=&end=`
- [x] `EventsController#create` — accept `optimistic_id`, persist, rely on
      Broadcastable to broadcast
- [x] `EventsController#update` — drag/drop/resize destination; same optimistic-id
      pattern as stimulus_grid's cell endpoint
- [x] `EventsController#destroy`
- [x] `ResourcesController#index` — JSON list
- [x] Controller integration tests in `gem/demo/test/integration/`

### 14f — View partial

- [x] `app/views/stimulus_calendar_rails/calendars/_calendar.html.erb` —
      renders the `.ec` container with all `data-controller="calendar"` value
      attributes derived from the calendar class + locals, plus
      `<%= turbo_stream_from(*StimulusCalendarRails.streamables_for(resource)) %>`
- [x] Helper module for `data-*` value attribute serialisation

### 14g — Dummy Rails app exercise (`gem/demo`)

- [x] `app/models/event.rb` — include `Broadcastable`, `broadcasts_calendar
      EventCalendar`, validates
- [x] `app/models/resource.rb`
- [x] `app/calendars/event_calendar.rb` — declare fields + scope
- [x] `app/controllers/calendars_controller.rb#index` — render the partial
- [x] `db/migrate/…create_events.rb`, `…create_resources.rb`
- [x] Fixtures or factory helper in `test/test_helper.rb`
- [x] System test: drag an event → other tab updates (using
      `capybara-action-cable` style assertion)

### 14h — Concurrency + conflicts

- [x] Per-field `concurrency: :version_checked` honoring `lock_version`
- [x] `calendar-conflict` broadcast on stale write
- [x] `gem/demo` integration test: stale move → conflict, fresh move → succeed

### 14i — Multi-tenant + auth

- [x] `parent_controller` config respected by all gem controllers
- [x] ActsAsTenant scoping in `streamables_for`
- [x] `gem/demo` test: tenant A's broadcast never reaches tenant B

### 14j — Release prep for the gem

- [x] `gem/stimulus_calendar_rails/README.md` (gem-specific quick start)
- [x] `gem/stimulus_calendar_rails/CHANGELOG.md`
- [x] `bin/rails stimulus_calendar_rails:install:migrations` task
- [x] `gem build stimulus_calendar_rails.gemspec` smoke step in CI

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
- [x] Phase 0a — Documentation, skills, gem skeleton, dummy Rails app
- [x] Phase 1 — Core libraries
- [x] Phase 2 — State & options
- [x] Phase 3 — Calendar controller + global options
- [x] Phase 4 — Toolbar
- [x] Phase 5 — DayGrid view
- [x] Phase 6 — TimeGrid view
- [x] Phase 7 — List view
- [x] Phase 8 — Resources + ResourceTimeGrid
- [x] Phase 9 — ResourceTimeline
- [x] Phase 10 — Events surface
- [ ] Phase 11 — Interaction plugin
- [ ] Phase 12 — Public methods
- [ ] Phase 13 — JS broadcast core
- [ ] Phase 14 — Rails companion gem `stimulus_calendar_rails`
- [ ] Phase 15 — Cross-cutting docs & polish
- [ ] Phase 16 — Release
