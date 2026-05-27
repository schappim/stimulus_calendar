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

    # S2 — Series-aware ops. The library doesn't expand RRULE on the
    # client; the host expands and pushes one event per occurrence
    # with `extendedProps.series.id` carrying the master id. These ops
    # let the server tell every subscribed client: "the occurrence at
    # (series_id, date) was either dropped or patched."
    #
    # On the JS side this surgically removes / patches the matching
    # occurrence in the local store and fires
    # `calendar:seriesOccurrence{Skipped,Overridden}` so hosts can
    # update other surfaces.
    def event_skip_occurrence(calendar:, series_id:, date:)
      tag("calendar-event", calendar: calendar, op: "skip-occurrence",
                            series_id: series_id, date: date) do
        ERB::Util.html_escape({ seriesId: series_id, date: date }.to_json)
      end
    end

    # `overrides` is a hash of attribute → new value. Keys mirror the
    # event payload shape (title, start, end, backgroundColor,
    # extendedProps, …). The JS side does a shallow merge over the
    # local occurrence.
    def event_override_occurrence(calendar:, series_id:, date:, overrides:)
      tag("calendar-event", calendar: calendar, op: "override-occurrence",
                            series_id: series_id, date: date) do
        ERB::Util.html_escape({
          seriesId: series_id, date: date,
          overrides: overrides,
        }.to_json)
      end
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
