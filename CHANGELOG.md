# Changelog

All notable changes to `@ninjaai/stimulus_calendar` (npm) and the matching
`stimulus_calendar_rails` (RubyGems) are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- **`options.height` now reaches pager-wrapped views.** The fixed-height
  flex chain only ran `view → grid`, but the Pager inserts
  `view → .ec-pager → .ec-pager-track → .ec-pager-page-current → grid`. The
  track + current page were `display:block` and sized to content, so the
  grid grew past the configured height and the pager's `overflow:hidden`
  clipped it with no scroll (week/day/staff couldn't scroll to
  afternoon/evening hours). The has-height CSS now flexes through the pager
  so each view's own scroll region (time-grid body, list) engages —
  Calendar.app / Google Calendar style internal vertical scroll. Swiping is
  unaffected.

### Changed

- **Per-view height strategy.** With `options.height` set, day-grid (month)
  views now GROW to fit their content — the configured height becomes a
  min-height floor so a tall month is never clipped (the page scrolls).
  Time-axis views (time-grid, resource time-grid, list, resource timeline)
  keep the fixed height and scroll internally. `data-calendar-has-height`
  is now set per-view (fixed mode only) rather than once at mount.
- **Event coverage cache.** `_refetchEvents` now pulls a buffered window
  (the months the active range touches, padded a week each side) and
  records it; `loadEventsEffect` skips the network round-trip while the
  active range stays inside that window. Switching VIEW
  (month → week → day → agenda → staff) or paging a step reuses the
  already-loaded events instead of refetching. Explicit
  `calendarApi.refetchEvents()` still forces a fresh fetch.

## [0.1.0] — 2026-05-25

First public release. **JS package** + **Rails companion gem** both ship together.

### Added — JS (`@ninjaai/stimulus_calendar`)

- **Stimulus controller** (`<div data-controller="calendar">`) — full
  lifecycle, mounts root DOM, exposes `element.calendarApi`, fires
  `calendar:ready` and 18 other CustomEvents around interactions and
  broadcasts.
- **Six built-in views** across four plugins:
  - **DayGrid** — `dayGridMonth`, `dayGridWeek`, `dayGridDay`
  - **TimeGrid** — `timeGridWeek`, `timeGridDay`
  - **List** — `listDay`, `listWeek`, `listMonth`, `listYear`
  - **Resource + ResourceTimeGrid** — `resourceTimeGridDay`,
    `resourceTimeGridWeek`
  - **ResourceTimeline** — `resourceTimelineDay/Week/Month/Year`
  - **Interaction** — `dateClick`, drag/resize option surface (full
    pointer geometry continues in 0.2)
- **150+ options** — every option from vkurko/calendar v5.7.1 is
  recognised. Documented exhaustively in `README.md`, `skills/`, and
  `docs/REFERENCE.md`. No external upstream reference required.
- **Public API** (`element.calendarApi`): `addEvent`, `updateEvent`,
  `removeEventById`, `getEvents`, `getEventById`, `refetchEvents`,
  `refetchResources`, `getResources`, `next`, `prev`, `today`,
  `gotoDate`, `getView`, `setOption`, `getOption`, `unselect`,
  `dateFromPoint`, plus `StimulusCalendar.create` / `destroy` for the
  IIFE path.
- **Live multi-user sync** — transport-agnostic `BroadcastBus` plus
  adapters for `broadcast-channel`, `websocket`, `action-cable`,
  `turbo-stream`. Options: `broadcast`, `broadcastChannel`,
  `broadcastFilter`. Payload schema documented in `docs/BROADCAST.md`.
- **Build** — dual IIFE + ESM library (`dist/stimulus_calendar.js` +
  `.esm.js` + `.css`). 246 passing Vitest tests.

### Added — Rails (`stimulus_calendar_rails`)

- **`StimulusCalendarRails::Calendar`** base class — declarative
  `resource :events`, `model Event`, `field :title, type: :string,
  editable: true` DSL with eight field types
  (string/text/integer/datetime/date/boolean/enum/reference).
- **`StimulusCalendarRails::Broadcastable`** Active Record concern —
  `broadcasts_calendar EventCalendar` wires create/update/destroy commit
  callbacks into tenant-scoped `<turbo-stream action="calendar-event">`
  broadcasts. Updates broadcast only changed registered fields.
- **Custom Turbo Stream actions** — `op="add"`, `update`, `remove`,
  `refetch`, `conflict`, `bulk`. JS turbo-stream adapter consumes them
  through the BroadcastBus.
- **Engine** — `StimulusCalendarRails::Engine`, importmap-pinned
  (`stimulus_calendar`, `stimulus_calendar_rails`), asset precompile,
  view-path append.
- **Controllers + routes** — `events#index/create/update/destroy/bulk`
  + `resources#index`. Per-field server-side editable check + coerce +
  validate + save before broadcast.
- **View partial** —
  `<%= render partial: "stimulus_calendar_rails/calendars/calendar",
  locals: { calendar:, events:, view: "timeGridWeek" } %>` mounts the
  JS calendar with seeded events + auto-subscribes to the live
  broadcast stream.
- **Multi-tenancy** — `streamables_for(resource)` is automatically
  tenant-scoped via ActsAsTenant when present. `parent_controller`
  configuration lets host apps inherit Devise + ActsAsTenant
  before_actions across the gem's controllers.
- **Dummy Rails app** (`gem/demo/`) — full integration testbed used by
  CI. 17 passing Minitest cases covering broadcast emission, range
  fetch, CRUD endpoints, non-editable field rejection.

### Added — Docs / skills

- **README.md** — install (IIFE / npm / Rails gem / clone-and-run),
  quick start, 6 screenshots, attribute tables for **every** option
  inline (no upstream references), events list, public API, full Rails
  section, demos / build / tests / license.
- **RAILS.md** — Hotwire-Native Event Calendar build checklist (21
  sections), modelled on `stimulus_grid`'s.
- **docs/BROADCAST.md** — broadcast payload schema, conflict policy,
  per-adapter use case table.
- **docs/REFERENCE.md** — programmatic JS API reference (cross-links
  README sections).
- **docs/RAILS_REFERENCE.md** — programmatic Rails API reference for
  the Calendar / Field / Broadcastable / TurboStreams / endpoints.
- **skills/stimulus-calendar-js/SKILL.md** — LLM-oriented JS usage
  guide.
- **skills/stimulus-calendar-rails/SKILL.md** — LLM-oriented Rails
  usage guide.
- **PLAN.md** — full ~170-checkbox migration plan with progress
  counter; every box ticked.

### CI

- GitHub Actions runs `npm test` (Vitest on node 22) **and**
  `bin/rails test` in `gem/demo` (Ruby 3.3 with bundler-cache) on
  every push/PR, plus a `gem build` check for the
  `stimulus_calendar_rails` gemspec.

[Unreleased]: https://github.com/schappim/stimulus_calendar/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/schappim/stimulus_calendar/releases/tag/v0.1.0
