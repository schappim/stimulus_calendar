require "test_helper"

class CalendarsIndexTest < ActionDispatch::IntegrationTest
  test "GET /calendars renders the placeholder table" do
    Event.create!(title: "Standup",
                  starts_at: 1.hour.from_now,
                  ends_at:   1.hour.from_now + 30.minutes)
    get "/calendars"
    assert_response :success
    assert_includes response.body, "Events"
    assert_includes response.body, "Standup"
  end
end
