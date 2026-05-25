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

    # POST /:resource/bulk
    #
    # Body: { changes: [
    #   { id: "1", attributes: {...}, optimistic_id: "..." },
    #   { id: "2", attributes: {...}, optimistic_id: "..." },
    #   ...
    # ] }
    #
    # Applies each change inside one DB transaction. If any change fails
    # validation or coercion, the whole bulk rolls back and 422 lists every
    # error grouped by id. On success, every model commit hook still fires
    # so each change broadcasts as a separate Turbo Stream.
    def bulk
      calendar = calendar_for(params[:resource])
      changes  = Array(params[:changes]).map(&:to_unsafe_h)
      results  = []
      errors_by_id = {}

      ::ActiveRecord::Base.transaction do
        changes.each do |change|
          row = find_event!(calendar, change[:id] || change["id"])
          attrs = (change[:attributes] || change["attributes"] || {}).to_h
          row._scr_optimistic_id = change[:optimistic_id] || change["optimistic_id"] if row.respond_to?(:_scr_optimistic_id=)

          attrs.each do |name, raw|
            field = calendar.class.fields_registry[name.to_sym]
            next unless field
            unless field.editable_for?(row, current_calendar_user)
              (errors_by_id[row.id] ||= []) << "field #{name} is not editable"
              next
            end
            value, coerce_err = field.coerce(raw)
            if coerce_err
              (errors_by_id[row.id] ||= []) << coerce_err
              next
            end
            ok, errs, _ms = calendar.apply_field!(row, field, value)
            (errors_by_id[row.id] ||= []).concat(errs) unless ok
          end

          results << { id: row.id }
        end

        if errors_by_id.any? { |_, v| v.any? }
          raise ::ActiveRecord::Rollback
        end
      end

      if errors_by_id.any? { |_, v| v.any? }
        render json: { ok: false, errors: errors_by_id }, status: :unprocessable_entity
      else
        render json: { ok: true, results: results }
      end
    end
  end
end
