module StimulusCalendarRails
  class BaseController < StimulusCalendarRails.parent_controller.constantize
    skip_forgery_protection if respond_to?(:skip_forgery_protection)

    def calendar_for(resource)
      klass = StimulusCalendarRails.lookup_calendar(resource)
      klass.new(user: current_calendar_user)
    end

    def find_event!(calendar, id)
      calendar.scope.find(id)
    end

    def current_calendar_user
      respond_to?(:current_user) ? current_user : nil
    end

    def turbo_stream_render(stream, status: :ok)
      respond_to do |format|
        format.turbo_stream { render plain: stream, content_type: "text/vnd.turbo-stream.html", status: status }
        format.json         { render json: { ok: status == :ok }, status: status }
      end
    end
  end
end
