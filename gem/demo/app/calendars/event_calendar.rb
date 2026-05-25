class EventCalendar < StimulusCalendarRails::Calendar
  resource :events
  model    Event

  field :title,       type: :string,   editable: true
  field :starts_at,   type: :datetime, editable: true, concurrency: :version_checked
  field :ends_at,     type: :datetime, editable: true, concurrency: :version_checked,
                      validate: ->(v, row) { "end must be after start" if row.starts_at && v <= row.starts_at }
  field :resource_id, type: :reference, editable: ->(_row, user) { user&.admin? }
  field :all_day,     type: :boolean,  editable: true
  field :color,       type: :string,   editable: false

  def new_event_defaults
    { title: "New event", starts_at: 1.hour.from_now, ends_at: 2.hours.from_now }
  end
end
