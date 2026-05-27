require "json"

module StimulusCalendarRails
  # Base class for declaring a server-side calendar. Subclass and declare
  # `resource`, `model`, and a set of `field`s; the gem's controllers
  # and Broadcastable concern dispatch through your declaration for
  # authz/coercion/validation/broadcasting.
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
  #   end
  class Calendar
    class << self
      attr_reader :resource_name, :model_class, :fields_registry

      def resource(name)
        @resource_name = name.to_s
        StimulusCalendarRails.register_calendar(@resource_name, self)
      end

      def model(klass)
        @model_class = klass
      end

      def field(name, **opts)
        @fields_registry ||= {}
        @fields_registry[name.to_sym] = Field.new(name, **opts)
      end

      def resolve_field!(name)
        field = fields_registry[name.to_sym]
        raise ArgumentError, "Unknown field #{name} on #{self.name}" unless field
        field
      end
    end

    attr_reader :user

    def initialize(user: nil)
      @user = user
    end

    def fields
      self.class.fields_registry&.values || []
    end

    # Per-row authorization scoping. Override in subclasses for tenant
    # scoping (`model_class.where(account: user.account)`).
    def scope(_user = user)
      self.class.model_class.all
    end

    # Default attributes for a new row created via the "+" button.
    def new_event_defaults
      {}
    end

    # Serialize a row into the JSON payload the JS bus broadcasts. ISO
    # strings for datetimes, primitive types otherwise.
    def event_to_h(row)
      h = { "id" => row.id }
      fields.each do |f|
        v = row.respond_to?(f.name) ? row.send(f.name) : nil
        h[f.name.to_s] = serialize_value(v, f)
      end
      h
    end

    def event_to_json(row)
      JSON.generate(event_to_h(row))
    end

    # Apply a field mutation to a row. Returns [ok?, errors, mutations].
    # mutations is an array of [field, value] tuples (the field that
    # changed + any dependents).
    def apply_field!(row, field, value)
      errors = field.validate(value, row)
      return [false, errors, []] if errors.any?

      old_value = row.send(field.name)
      row.send("#{field.name}=", value)
      saved = row.respond_to?(:save) ? row.save : true
      if saved
        [true, [], [[field.name, value]]]
      else
        row.send("#{field.name}=", old_value)
        [false, Array(row.respond_to?(:errors) ? row.errors.full_messages : ["save failed"]), []]
      end
    end

    def field_value(row, field)
      row.respond_to?(field.name) ? row.send(field.name) : nil
    end

    private

    def serialize_value(v, field)
      case field.type
      when :integer                       then v.to_i
      when :boolean                       then !!v
      when :date                          then v.respond_to?(:to_date) ? v.to_date.iso8601 : v
      when :datetime                      then v.respond_to?(:iso8601) ? v.iso8601 : v
      when :reference_array, :string_array
        # Always emit a plain Array of strings so the JS-side
        # createEvents() can drop them into event.resourceIds /
        # custom array extendedProps without further parsing.
        Array(v).map(&:to_s)
      else v
      end
    end
  end
end
