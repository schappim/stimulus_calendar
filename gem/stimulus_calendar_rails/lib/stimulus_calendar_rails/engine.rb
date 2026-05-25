require "rails/engine"
require "turbo-rails"
require "stimulus-rails"
require "importmap-rails"

module StimulusCalendarRails
  class Engine < ::Rails::Engine
    isolate_namespace StimulusCalendarRails

    initializer "stimulus_calendar_rails.assets" do |app|
      if app.config.respond_to?(:assets)
        app.config.assets.precompile += %w[
          stimulus_calendar.js
          stimulus_calendar_rails.js
          stimulus_calendar.css
          stimulus_calendar_rails.css
        ]
      end
    end

    initializer "stimulus_calendar_rails.importmap", before: "importmap" do |app|
      if app.config.respond_to?(:importmap)
        app.config.importmap.paths << Engine.root.join("config/importmap.rb")
        app.config.importmap.cache_sweepers << Engine.root.join("app/assets/javascripts")
      end
    end

    initializer "stimulus_calendar_rails.view_paths" do |_app|
      ActiveSupport.on_load(:action_controller) do
        append_view_path StimulusCalendarRails::Engine.root.join("app/views")
      end
    end
  end
end
