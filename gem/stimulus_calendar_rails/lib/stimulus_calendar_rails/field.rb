module StimulusCalendarRails
  # One field on a Calendar. Captures everything the server needs to
  # authorise, coerce, validate, and broadcast changes for this field.
  # Created via the `field` DSL on Calendar; not instantiated directly.
  class Field
    TYPES = %i[string text integer datetime date boolean enum reference reference_array string_array].freeze

    attr_reader :name, :type, :enum_values, :concurrency, :validators, :header

    def initialize(name, type:, editable: false, enum_values: nil,
                   concurrency: :last_write_wins, validate: nil, header: nil)
      raise ArgumentError, "Unknown field type #{type.inspect}" unless TYPES.include?(type)
      @name        = name.to_sym
      @type        = type
      @editable    = editable
      @enum_values = enum_values
      @concurrency = concurrency
      @validators  = Array(validate)
      @header      = header || name.to_s.humanize
    end

    # Per-row, per-user editable check. Server re-evaluates on every PATCH.
    def editable_for?(row, user)
      case @editable
      when true, false then @editable
      when Proc then !!@editable.call(row, user)
      else !!@editable
      end
    end

    def editable_static? = @editable == true

    # Coerce a raw string value (from a JSON body) to this field's Ruby
    # type. Returns [value, error] — error is a string if coercion failed.
    def coerce(raw)
      case @type
      when :string, :text, :enum, :reference then [raw.to_s, nil]
      when :integer                          then [Integer(raw.to_s, 10), nil]
      when :datetime                         then [Time.zone.parse(raw.to_s), nil]
      when :date                             then [Date.parse(raw.to_s), nil]
      when :boolean
        [%w[1 true yes on t].include?(raw.to_s.downcase), nil]
      when :reference_array, :string_array
        # Array fields arrive as a JSON array (from the JS bus payload's
        # resourceIds = ['r2']) or a comma-separated string. Map every
        # element to a String so downstream model coercion sees a
        # consistent shape.
        arr = raw.is_a?(Array) ? raw : raw.to_s.split(",").map(&:strip)
        [arr.compact.map(&:to_s), nil]
      else [raw, nil]
      end
    rescue ArgumentError, TypeError => e
      [nil, "invalid #{@type}: #{e.message}"]
    end

    # Run user-defined validators. Returns Array of error strings.
    def validate(value, row)
      @validators.flat_map do |v|
        result = v.call(value, row)
        case result
        when nil, true then []
        when String    then [result]
        when Array     then result
        else [result.to_s]
        end
      end
    end
  end
end
