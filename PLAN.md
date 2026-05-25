# Migration plan: vkurko/calendar → stimulus_calendar

The goal: a 100% feature-complete Stimulus.js port of
[vkurko/calendar](https://github.com/vkurko/calendar) (v5.7.1), with first-class
**Turbo Streams broadcasting** for real-time multi-user sync.

The upstream Svelte 5 source lives at `./calendar/` (gitignored) and is the
reference implementation we're porting.

## Rules of engagement

- **One commit per unchecked box.** Granularity is per individual option, method
  or feature — small, reviewable, bisectable.
- **Every commit ships tests.** Pure logic → Vitest in `test/`. DOM behaviour →
  controller tests under JSDOM, plus a demo page exercising the feature in
  isolation.
- **Every user-visible feature ships a demo.** New demos land under `demo/NN-…html`
  and get linked from `demo/index.html`. Updates to existing demos count as part
  of the same commit.
- **No "and also fixed X" commits.** If unrelated rot needs cleaning, that's a
  separate commit.
- Commit messages: `feat(lib): add date utilities`, `feat(view): dayGridMonth`,
  `feat(opt): hiddenDays`, `feat(broadcast): turbo-stream adapter`, etc.

---

## Phase 0 — Scaffold

- [x] Project skeleton: `package.json`, `vite.config.js`, `vite.lib.config.js`,
      `vitest.config.js`, `src/{controllers,lib,styles}/`, `test/`, `demo/`,
      `.github/workflows/ci.yml`, `README.md`, `LICENSE`, `.gitignore`
      (excluding `calendar/`), this file.

---

## Phase 1 — Core libraries (pure JS, no DOM)

These mirror `calendar/packages/core/src/lib/` — pure modules under `src/lib/`
with full Vitest coverage. No Stimulus controllers yet.

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

- [ ] Title rendering (uses `titleFormat` against active range)
- [ ] `prev` button + click behaviour
- [ ] `next` button + click behaviour
- [ ] `today` button + click behaviour
- [ ] View switcher buttons (one per registered view name)
- [ ] `customButtons` rendering and click dispatch
- [ ] `headerToolbar` slot layout (`start` / `center` / `end`)
- [ ] Disabled state on prev/next when bounded by `validRange`

---

## Phase 5 — DayGrid view (month / week / day)

- [ ] View skeleton: `dayGridMonth` — weeks × days CSS grid
- [ ] View: `dayGridWeek`
- [ ] View: `dayGridDay`
- [ ] Day cell rendering: `day`, `today` highlight, other-month dimming
- [ ] Option: `dayCellFormat`
- [ ] Option: `dayCellContent`
- [ ] Event rendering inside day cells (dot + title + time)
- [ ] Option: `dayMaxEvents` — collapse with "+N more" link
- [ ] Option: `moreLinkContent`
- [ ] Day popover when "+N more" clicked
- [ ] Option: `dayPopoverFormat`
- [ ] Option: `weekNumbers`
- [ ] Option: `weekNumberContent`

---

## Phase 6 — TimeGrid view (week / day with slots)

- [ ] View: `timeGridWeek` — sidebar + day columns + slot grid
- [ ] View: `timeGridDay`
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
- [ ] Now indicator (horizontal red line)
- [ ] Option: `nowIndicator`

---

## Phase 7 — List view

- [ ] View: `listDay`
- [ ] View: `listWeek`
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
- [ ] View: `resourceTimeGridDay`
- [ ] View: `resourceTimeGridWeek`
- [ ] Option: `datesAboveResources`
- [ ] Option: `resourceLabelContent`
- [ ] Option: `resourceLabelDidMount`
- [ ] Option: `filterResourcesWithEvents`
- [ ] Option: `filterEventsWithResources`

---

## Phase 9 — ResourceTimeline

- [ ] View: `resourceTimelineDay`
- [ ] View: `resourceTimelineWeek`
- [ ] View: `resourceTimelineMonth`
- [ ] View: `resourceTimelineYear`
- [ ] Option: `monthHeaderFormat`
- [ ] Option: `slotWidth`
- [ ] Option: `resourceExpand` (expand/collapse nested rows)
- [ ] Now indicator (vertical line)

---

## Phase 10 — Events surface (cross-view)

- [ ] Option: `events` (static array)
- [ ] Option: `eventSources` (array of sources — array, function, URL)
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
- [ ] Drag: `eventDrop`
- [ ] Option: `eventDragMinDistance`
- [ ] Option: `eventLongPressDelay`
- [ ] Option: `dragConstraint`
- [ ] Option: `dragScroll`
- [ ] Resize handles + rendering
- [ ] Resize: `eventResizeStart`
- [ ] Resize: `eventResizeStop`
- [ ] Resize: `eventResize`
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
- [ ] `addEvent(event)`
- [ ] `updateEvent(event)`
- [ ] `removeEventById(id)`
- [ ] `getEvents()`
- [ ] `getEventById(id)`
- [ ] `refetchEvents()`
- [ ] `refetchResources()`
- [ ] `getView()`
- [ ] `next()`
- [ ] `prev()`
- [ ] `unselect()`
- [ ] `dateFromPoint(x, y)`
- [ ] IIFE convenience: `EventCalendar.create` / `EventCalendar.destroy`

---

## Phase 13 — Turbo Streams broadcasting *(new feature; not in upstream)*

Goal: when one user mutates the calendar, every other connected user sees the
change live. Transport-agnostic core with a first-class Turbo Streams adapter.

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
- [ ] Demo: two browser windows synced via `BroadcastChannel` (no server)
- [ ] Demo: Turbo Streams over a mock WebSocket echo server (node script in
      `demo/server/`)
- [ ] Docs: `docs/BROADCAST.md` — payload schema, Rails recipe with
      `Turbo::StreamsChannel.broadcast_action_to(...)`

---

## Phase 14 — Cross-cutting polish

- [ ] Accessibility audit: aria roles per view, keyboard nav, focus management
- [ ] Mobile touch behaviour (long-press, scroll-vs-drag)
- [ ] Dark mode (`ec-dark` class) — match upstream demo
- [ ] Locale pack examples (en, fr, de, es, ja, …) using `Intl`
- [ ] Timezone support via `Intl.DateTimeFormat` with named TZ
- [ ] Performance pass: virtualise long event lists in list / timeline views
- [ ] Browser support matrix in README
- [ ] `CHANGELOG.md`

---

## Phase 15 — Release

- [ ] README: usage, full options table, methods, theming
- [ ] CI: lint step (eslint) added to existing build + test workflow
- [ ] npm publish prep (`prepublishOnly`, `files` whitelist verified)
- [ ] CDN bundle smoke test (`dist/stimulus_calendar.js` in a plain HTML page)
- [ ] Tag and publish `0.1.0`

---

## Progress counter

When a phase is fully done, tick it here too — gives an at-a-glance view in
the GitHub repo without expanding every section.

- [x] Phase 0 — Scaffold
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
- [ ] Phase 13 — Turbo Streams broadcasting
- [ ] Phase 14 — Cross-cutting polish
- [ ] Phase 15 — Release
