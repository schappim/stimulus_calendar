class CalendarsController < ApplicationController
  def index
    @start  = (params[:start].presence || 1.week.ago).to_time
    @end    = (params[:end].presence || 2.weeks.from_now).to_time
    @events = Event.between(@start, @end).order(:starts_at)
  end
end
