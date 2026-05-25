# stimulus_calendar

> Full-sized drag &amp; drop event calendar for **Stimulus.js** (Hotwire) &mdash;
> month, week, day, list, resource and timeline views. With live multi-user
> sync over Turbo Streams.

A 100% Stimulus port of [vkurko/calendar](https://github.com/vkurko/calendar).
Inspired by [FullCalendar](https://fullcalendar.io/).

## Status

🚧 **Early — migration in progress.** See [PLAN.md](./PLAN.md) for the
per-feature checklist. Each unchecked box is a planned commit, shipped with
tests and a demo page.

## Install (will work once `0.1.0` is published)

```bash
npm install --save @ninjaai/stimulus_calendar @hotwired/stimulus
```

Or via CDN (importmap / `<script>` tag):

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@ninjaai/stimulus_calendar/dist/stimulus_calendar.css">
<script src="https://cdn.jsdelivr.net/npm/@ninjaai/stimulus_calendar/dist/stimulus_calendar.js"></script>
```

## Quick start (target API)

```html
<div data-controller="calendar"
     data-calendar-view-value="timeGridWeek"
     data-calendar-plugins-value='["TimeGrid", "Interaction"]'
     data-calendar-options-value='{"events": [...]}'></div>
```

Or imperatively:

```js
import StimulusCalendar from '@ninjaai/stimulus_calendar';
StimulusCalendar.start();

const ec = window.StimulusCalendar.create(document.getElementById('ec'), {
  view: 'timeGridWeek',
  events: [/* … */],
});
```

## Turbo Streams broadcasting

When one user adds, drags or resizes an event, every other connected user
sees it instantly. Transport-agnostic core, with a first-class
`<turbo-stream action="calendar-event">` adapter for Rails apps. Works
equally well with raw WebSockets, ActionCable or BroadcastChannel.

## Develop

```bash
npm install
npm run dev          # http://localhost:5173/demo/
npm test
npm run build:lib    # dist/stimulus_calendar.js + .esm.js + .css
```

## License

MIT &mdash; see [LICENSE](./LICENSE). Portions ported from
[vkurko/calendar](https://github.com/vkurko/calendar) (MIT).
