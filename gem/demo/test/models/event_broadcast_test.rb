require "test_helper"

class EventBroadcastTest < ActiveSupport::TestCase
  test "create fires a calendar-event op=add broadcast" do
    msgs = capture_broadcasts(*StimulusCalendarRails.streamables_for(:events)) do
      Event.create!(title: "Standup",
                    starts_at: 1.hour.from_now, ends_at: 1.hour.from_now + 30.minutes)
    end
    assert msgs.any? { |m| m.include?('op="add"') }, "expected an add broadcast, got #{msgs.inspect}"
  end

  test "update fires a calendar-event op=update broadcast with only changed fields" do
    event = Event.create!(title: "Standup",
                          starts_at: 1.hour.from_now, ends_at: 1.hour.from_now + 30.minutes)
    msgs = capture_broadcasts(*StimulusCalendarRails.streamables_for(:events)) do
      event.update!(title: "Renamed")
    end
    update_msg = msgs.find { |m| m.include?('op="update"') }
    assert update_msg.present?, "expected an update broadcast"
    # The JSON payload is HTML-escaped inside the <template>.
    assert_includes update_msg, "title&quot;:&quot;Renamed"
  end

  test "destroy fires a calendar-event op=remove broadcast" do
    event = Event.create!(title: "Doomed",
                          starts_at: 1.hour.from_now, ends_at: 1.hour.from_now + 30.minutes)
    msgs = capture_broadcasts(*StimulusCalendarRails.streamables_for(:events)) do
      event.destroy
    end
    assert msgs.any? { |m| m.include?('op="remove"') }, "expected a remove broadcast, got #{msgs.inspect}"
  end

  private

  # Capture the raw broadcast HTML strings sent through Turbo::StreamsChannel
  # during the block. Easier than asserting the Turbo helpers via the
  # turbo-rails test integration since they're rolled into HTML strings.
  def capture_broadcasts(*streamables)
    captured = []
    original = Turbo::StreamsChannel.method(:broadcast_stream_to)
    Turbo::StreamsChannel.define_singleton_method(:broadcast_stream_to) do |*args, **kwargs|
      captured << kwargs[:content].to_s
      nil
    end
    yield
    captured
  ensure
    Turbo::StreamsChannel.define_singleton_method(:broadcast_stream_to, original)
  end
end
