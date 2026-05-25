require_relative "lib/stimulus_calendar_rails/version"

Gem::Specification.new do |spec|
  spec.name        = "stimulus_calendar_rails"
  spec.version     = StimulusCalendarRails::VERSION
  spec.authors     = ["Marcus Schappi"]
  spec.email       = ["marcus@chickcom.com"]
  spec.summary     = "Rails + Hotwire companion for stimulus_calendar — live multi-user event calendar over Turbo Streams."
  spec.description = "Server-driven event calendar engine: declarative EventCalendar DSL, Broadcastable model concern, custom Turbo Stream actions (calendar-event-add/update/remove, calendar-resource-*, calendar-source-refetch, calendar-bulk, calendar-conflict), and importmap-pinned JS bundles for the stimulus_calendar library."
  spec.homepage    = "https://github.com/schappim/stimulus_calendar"
  spec.license     = "MIT"

  spec.required_ruby_version = ">= 3.1.0"

  spec.metadata["homepage_uri"]    = spec.homepage
  spec.metadata["source_code_uri"] = "https://github.com/schappim/stimulus_calendar/tree/main/gem/stimulus_calendar_rails"
  spec.metadata["changelog_uri"]   = "https://github.com/schappim/stimulus_calendar/blob/main/gem/stimulus_calendar_rails/CHANGELOG.md"

  spec.files = Dir.chdir(__dir__) do
    Dir["{app,config,db,lib}/**/*", "MIT-LICENSE", "Rakefile", "README.md"]
  end

  spec.add_dependency "rails",          ">= 7.1"
  spec.add_dependency "turbo-rails",    ">= 2.0"
  spec.add_dependency "stimulus-rails", ">= 1.3"
  spec.add_dependency "importmap-rails", ">= 2.0"
end
