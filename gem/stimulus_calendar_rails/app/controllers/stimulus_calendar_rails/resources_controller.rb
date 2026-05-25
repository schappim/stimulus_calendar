module StimulusCalendarRails
  # Per-calendar resource list endpoint (for Resource / ResourceTimeline
  # views). The calendar class can override how resources are fetched by
  # implementing `resources_for(user)`.
  class ResourcesController < BaseController
    def index
      calendar = calendar_for(params[:resource])
      list = if calendar.respond_to?(:resources_for)
        calendar.resources_for(current_calendar_user)
      else
        []
      end
      render json: list
    end
  end
end
