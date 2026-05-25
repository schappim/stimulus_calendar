class CalendarsController < ApplicationController
  def index
    @start  = (params[:start].presence || 1.week.ago).to_time
    @end    = (params[:end].presence || 2.weeks.from_now).to_time
    @events = EventCalendar.events_for(@start, @end)
  end
end
