module StimulusCalendarRails
  # Custom Turbo Stream action builders. The JS adapter (turbo-stream)
  # listens for <turbo-stream action="calendar-event"> and applies the
  # payload through the BroadcastBus.
  module TurboStreams
    module_function

    def event_add(calendar:, event_id:, payload:, optimistic_id: nil)
      tag("calendar-event", calendar: calendar, op: "add",
                            event_id: event_id, optimistic_id: optimistic_id) do
        ERB::Util.html_escape(payload.is_a?(String) ? payload : payload.to_json)
      end
    end

    def event_update(calendar:, event_id:, attributes:, optimistic_id: nil)
      tag("calendar-event", calendar: calendar, op: "update",
                            event_id: event_id, optimistic_id: optimistic_id) do
        ERB::Util.html_escape(attributes.merge(id: event_id).to_json)
      end
    end

    def event_remove(calendar:, event_id:)
      tag("calendar-event", calendar: calendar, op: "remove", event_id: event_id) do
        ERB::Util.html_escape({ id: event_id }.to_json)
      end
    end

    def event_refetch(calendar:)
      tag("calendar-event", calendar: calendar, op: "refetch") { "" }
    end

    def event_conflict(calendar:, event_id:, server_value:, client_value:, optimistic_id: nil)
      tag("calendar-event", calendar: calendar, op: "conflict",
                            event_id: event_id, optimistic_id: optimistic_id) do
        ERB::Util.html_escape({
          id: event_id,
          server_value: server_value,
          client_value: client_value,
        }.to_json)
      end
    end

    def bulk(calendar:, streams:)
      tag("calendar-event", calendar: calendar, op: "bulk") { streams.join }
    end

    def tag(action, **attrs)
      attrs[:action] = action
      kept = attrs.compact
      attr_str = kept.map { |k, v| %(#{k.to_s.tr("_", "-")}="#{ERB::Util.html_escape(v)}") }.join(" ")
      payload = block_given? ? yield : nil
      template = payload ? "<template>#{payload}</template>" : ""
      %(<turbo-stream #{attr_str}>#{template}</turbo-stream>)
    end
  end
end
