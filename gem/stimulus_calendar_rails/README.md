# stimulus_calendar_rails

Rails + Hotwire companion for [stimulus_calendar](https://github.com/schappim/stimulus_calendar).
A server-driven, multi-user editable event calendar over Turbo Streams +
Action Cable — declarative `EventCalendar` schema, `Broadcastable` model
concern, custom Turbo Stream actions, optimistic edits with server reconcile.

🚧 **Early.** Engine skeleton only; feature surface lands per
[PLAN.md Phase 14](https://github.com/schappim/stimulus_calendar/blob/main/PLAN.md).

## Install

```ruby
# Gemfile
gem "stimulus_calendar_rails"
```

```bash
bundle install
```

```ruby
# config/routes.rb
mount ActionCable.server => "/cable"
mount StimulusCalendarRails::Engine => StimulusCalendarRails.mount_path   # default "/calendars"
```

```js
// app/javascript/application.js
import "@hotwired/turbo-rails"
import { Application } from "@hotwired/stimulus"
import StimulusCalendar from "stimulus_calendar"
import StimulusCalendarRails from "stimulus_calendar_rails"
const app = Application.start()
StimulusCalendar.start(app)
StimulusCalendarRails.start(app)
```

```erb
<%= stylesheet_link_tag "stimulus_calendar", "stimulus_calendar_rails" %>
<%= javascript_importmap_tags %>
```

## Usage

See the parent project's
[README — Rails section](https://github.com/schappim/stimulus_calendar#rails--hotwire-stimulus_calendar_rails)
and the LLM-oriented
[stimulus-calendar-rails skill](https://github.com/schappim/stimulus_calendar/blob/main/skills/stimulus-calendar-rails/SKILL.md).

## License

MIT — see [MIT-LICENSE](./MIT-LICENSE).
