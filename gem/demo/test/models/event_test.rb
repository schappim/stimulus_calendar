require "test_helper"

class EventTest < ActiveSupport::TestCase
  test "is valid with required fields" do
    e = Event.new(title: "Standup",
                  starts_at: Time.zone.now,
                  ends_at:   Time.zone.now + 30.minutes)
    assert e.valid?
  end

  test "requires title" do
    e = Event.new(starts_at: Time.zone.now, ends_at: Time.zone.now + 1.hour)
    assert_not e.valid?
    assert_includes e.errors[:title], "can't be blank"
  end

  test "requires starts_at and ends_at" do
    e = Event.new(title: "X")
    assert_not e.valid?
    assert_includes e.errors[:starts_at], "can't be blank"
    assert_includes e.errors[:ends_at],   "can't be blank"
  end

  test "ends_at must be after starts_at" do
    t = Time.zone.now
    e = Event.new(title: "X", starts_at: t, ends_at: t)
    assert_not e.valid?
    assert_includes e.errors[:ends_at], "must be after starts_at"
  end

  test ".between returns events overlapping the range" do
    Event.create!(title: "In range",
                  starts_at: 2.hours.from_now,
                  ends_at:   3.hours.from_now)
    Event.create!(title: "Before range",
                  starts_at: 2.days.ago,
                  ends_at:   2.days.ago + 1.hour)

    found = Event.between(1.hour.from_now, 4.hours.from_now)
    assert_equal ["In range"], found.map(&:title)
  end
end
