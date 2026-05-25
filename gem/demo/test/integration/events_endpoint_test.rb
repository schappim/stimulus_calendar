require "test_helper"

class EventsEndpointTest < ActionDispatch::IntegrationTest
  setup do
    @base = StimulusCalendarRails.mount_path  # "/calendars"
  end

  test "GET /calendars/events?start=&end= returns matching events as JSON" do
    e = Event.create!(title: "Standup",
                      starts_at: 1.hour.from_now, ends_at: 1.hour.from_now + 30.minutes)
    get "#{@base}/events/events",
        params: { start: Time.current.iso8601, end: 1.day.from_now.iso8601 }
    assert_response :success
    json = JSON.parse(response.body)
    ids = json.map { |r| r["id"] }
    assert_includes ids, e.id
  end

  test "POST /calendars/events/events creates an event" do
    assert_difference -> { Event.count }, 1 do
      post "#{@base}/events/events", as: :json, params: {
        attributes: { title: "Standup",
                      starts_at: 1.hour.from_now.iso8601,
                      ends_at:   2.hours.from_now.iso8601 },
      }
    end
    assert_response :created
  end

  test "PATCH /calendars/events/events/:id updates an editable field" do
    e = Event.create!(title: "Standup",
                      starts_at: 1.hour.from_now, ends_at: 1.hour.from_now + 30.minutes)
    patch "#{@base}/events/events/#{e.id}", as: :json, params: {
      attributes: { title: "Renamed" },
    }
    assert_response :success
    assert_equal "Renamed", e.reload.title
  end

  test "PATCH rejects a non-editable field" do
    e = Event.create!(title: "Standup",
                      starts_at: 1.hour.from_now, ends_at: 1.hour.from_now + 30.minutes)
    patch "#{@base}/events/events/#{e.id}", as: :json, params: {
      attributes: { color: "#ff0000" },
    }
    assert_response :unprocessable_entity
    body = JSON.parse(response.body)
    assert_includes body["errors"].join, "not editable"
  end

  test "DELETE /calendars/events/events/:id destroys the event" do
    e = Event.create!(title: "Doomed",
                      starts_at: 1.hour.from_now, ends_at: 1.hour.from_now + 30.minutes)
    assert_difference -> { Event.count }, -1 do
      delete "#{@base}/events/events/#{e.id}", as: :json
    end
    assert_response :no_content
  end
end
