Rails.application.routes.draw do
  # Mount Action Cable so live broadcasts work over WebSocket.
  mount ActionCable.server => "/cable"

  # Mount the stimulus_calendar_rails engine (default mount path "/calendars").
  # Phase 14e wires up /calendars/:resource/events etc.
  mount StimulusCalendarRails::Engine => StimulusCalendarRails.mount_path

  # Local calendars#index demo (renders a plain table until Phase 14f).
  get "calendars" => "calendars#index", as: :calendars

  get "up" => "rails/health#show", as: :rails_health_check

  root "calendars#index"
end
