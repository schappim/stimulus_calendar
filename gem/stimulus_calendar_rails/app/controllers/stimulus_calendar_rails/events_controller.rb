require_dependency "stimulus_calendar_rails/turbo_streams_helper"

module StimulusCalendarRails
  # Endpoints for calendar events.
  #
  #   GET    /calendars/:resource/events?start=&end=   → range-windowed JSON list
  #   POST   /calendars/:resource/events                → create
  #   PATCH  /calendars/:resource/events/:id            → update one or more fields
  #   DELETE /calendars/:resource/events/:id            → destroy
  #   DELETE /calendars/:resource/events/bulk           → destroy by id list
  class EventsController < BaseController
    def index
      calendar = calendar_for(params[:resource])
      rel = calendar.scope
      if params[:start].present? && params[:end].present? && rel.respond_to?(:where)
        # Parse to Time so SQLite/Postgres get a comparable datetime; raw ISO
        # strings don't compare lexically against the stored format.
        rel = rel.where(
          "ends_at > ? AND starts_at < ?",
          Time.zone.parse(params[:start].to_s),
          Time.zone.parse(params[:end].to_s),
        )
      end
      events = rel.map { |row| calendar.event_to_h(row) }
      render json: events
    end

    def create
      calendar = calendar_for(params[:resource])
      attrs    = (params[:attributes] || params[:event] || {}).to_unsafe_h
      defaults = calendar.new_event_defaults
      row = calendar.class.model_class.new(defaults.merge(attrs.symbolize_keys))
      row._scr_optimistic_id = params[:optimistic_id] if row.respond_to?(:_scr_optimistic_id=)
      if row.save
        render json: calendar.event_to_h(row), status: :created
      else
        render json: { errors: row.errors.full_messages }, status: :unprocessable_entity
      end
    end

    def update
      calendar = calendar_for(params[:resource])
      row      = find_event!(calendar, params[:id])
      attrs    = (params[:attributes] || params[:event] || {}).to_unsafe_h
      mutations = []
      errors   = []
      attrs.each do |name, raw|
        field = calendar.class.fields_registry[name.to_sym]
        next unless field
        unless field.editable_for?(row, current_calendar_user)
          errors << "field #{name} is not editable"
          next
        end
        value, coerce_err = field.coerce(raw)
        if coerce_err
          errors << coerce_err
          next
        end
        row._scr_optimistic_id = params[:optimistic_id] if row.respond_to?(:_scr_optimistic_id=)
        ok, errs, ms = calendar.apply_field!(row, field, value)
        errors.concat(errs)
        mutations.concat(ms)
      end
      if errors.empty?
        render json: { ok: true, mutations: mutations }
      else
        render json: { ok: false, errors: errors }, status: :unprocessable_entity
      end
    end

    def destroy
      calendar = calendar_for(params[:resource])
      row      = find_event!(calendar, params[:id])
      row._scr_optimistic_id = params[:optimistic_id] if row.respond_to?(:_scr_optimistic_id=)
      row.destroy
      head :no_content
    end

    def destroy_bulk
      calendar = calendar_for(params[:resource])
      ids = Array(params[:ids])
      calendar.scope.where(id: ids).destroy_all
      head :no_content
    end
  end
end
