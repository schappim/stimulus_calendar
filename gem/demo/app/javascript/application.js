// Configure your import map in config/importmap.rb. Read more: https://github.com/rails/importmap-rails
import "@hotwired/turbo-rails"
import "controllers"

// stimulus_calendar + the Rails companion. The gem auto-pins both via its
// own importmap manifest; they're imported here so the bundles execute.
import StimulusCalendar from "stimulus_calendar"
import StimulusCalendarRails from "stimulus_calendar_rails"

import { Application } from "@hotwired/stimulus"
window.Stimulus = window.Stimulus || Application.start()
if (typeof StimulusCalendar?.start === "function") StimulusCalendar.start(window.Stimulus)
if (typeof StimulusCalendarRails?.start === "function") StimulusCalendarRails.start(window.Stimulus)
