# app/calendars/event_calendar.rb
#
# Placeholder for the per-app Calendar declaration. The full DSL (resource,
# model, field DSL, scope) lands in PLAN.md Phase 14b. For now this just
# documents the *target* shape:
#
#   class EventCalendar < StimulusCalendarRails::Calendar
#     resource :events
#     model    Event
#
#     field :title,       type: :string,   editable: true
#     field :starts_at,   type: :datetime, editable: true, concurrency: :version_checked
#     field :ends_at,     type: :datetime, editable: true, concurrency: :version_checked,
#                         validate: ->(v, row) { "end must be after start" if v <= row.starts_at }
#     field :resource_id, type: :reference, editable: ->(_row, user) { user&.admin? }
#     field :all_day,     type: :boolean,  editable: true
#     field :color,       type: :string,   editable: false
#
#     def scope(_user) = model_class.all
#   end
class EventCalendar
  # Stub: returns events directly. Phase 14b replaces this with the real
  # Calendar base class.
  def self.events_for(range_start, range_end)
    Event.between(range_start, range_end).order(:starts_at)
  end
end
