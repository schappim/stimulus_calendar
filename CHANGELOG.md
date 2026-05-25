# Changelog

All notable changes to `@ninjaai/stimulus_calendar` (npm) and the matching
`stimulus_calendar_rails` (RubyGems) are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Project scaffold: Vite + Vitest build/test stack mirroring `stimulus_grid`,
  empty `CalendarController`, smoke test, demo landing page, GitHub Actions CI
  on node 22, MIT LICENSE, `.gitignore` excluding the upstream `calendar/`
  reference clone.
- `PLAN.md` enumerating every option, view and method to port from
  [vkurko/calendar](https://github.com/vkurko/calendar) v5.7.1 plus a Rails
  companion gem `stimulus_calendar_rails`, organised as 17 phases with one
  commit per checkbox.
- `RAILS.md` — Hotwire-Native Event Calendar build checklist (21 sections),
  modelled on `stimulus_grid`'s `RAILS.md`.
- `README.md` — install (IIFE / npm / Rails gem / clone-and-run), quick
  start, screenshot slots, attribute table, events, `calendarApi`, Rails
  section, demos, build, tests.
- `skills/stimulus-calendar-js/SKILL.md` and
  `skills/stimulus-calendar-rails/SKILL.md` — LLM-oriented usage guides
  matching the structure of `stimulus_grid`'s skills.
- `docs/images/.gitkeep` — per-feature screenshots land here as views ship.

[Unreleased]: https://github.com/schappim/stimulus_calendar/compare/v0.0.0...HEAD
