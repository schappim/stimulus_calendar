require "active_support/concern"

module StimulusCalendarRails
  # Lightweight cousin of Broadcastable for hosts that already have a
  # full-event serializer on the model (e.g. `as_calendar_event`) and
  # don't want to declare a Calendar class field-by-field.
  #
  # Usage:
  #
  #     class Appointment < ApplicationRecord
  #       include StimulusCalendarRails::SimpleBroadcastable
  #       broadcasts_calendar_events :appointments,
  #         payload: :as_calendar_event,
  #         scope: ->(record) { record.account }
  #     end
  #
  # The model's `payload` method is the source of truth for the wire
  # shape — it's called for `add` (full payload) and `update` (the
  # whole payload is treated as the new attribute set; the JS side
  # shallow-merges it onto the existing event). `remove` only needs
  # the id.
  #
  # The `scope:` lambda returns the tenant object whose
  # `class.name + id` becomes the stream token. Pass `nil` (or omit)
  # to fall back to ActsAsTenant.current_tenant if defined.
  #
  # The matching subscribe is:
  #
  #     <%= turbo_stream_from *StimulusCalendarRails.streamables_for(
  #       "appointments", scope: current_account) %>
  module SimpleBroadcastable
    extend ActiveSupport::Concern

    class_methods do
      def broadcasts_calendar_events(resource_name, payload: :as_calendar_event, scope: nil)
        self._scr_simple_resource = resource_name.to_s
        self._scr_simple_payload  = payload
        self._scr_simple_scope    = scope

        after_create_commit  { _scr_simple_broadcast(:add) }
        after_update_commit  { _scr_simple_broadcast(:update) }
        after_destroy_commit { _scr_simple_broadcast(:remove) }
      end
    end

    included do
      class_attribute :_scr_simple_resource, instance_accessor: false
      class_attribute :_scr_simple_payload,  instance_accessor: false
      class_attribute :_scr_simple_scope,    instance_accessor: false
      # Echo suppression — the host's controller stashes the
      # X-Optimistic-Id header value here before save, the broadcast
      # carries it back, and the originating client's calendarApi
      # drops the echo. Non-persisted, per-instance.
      attr_accessor :_scr_optimistic_id
    end

    private

    def _scr_simple_broadcast(op)
      resource = self.class._scr_simple_resource
      tokens = StimulusCalendarRails.streamables_for(resource, scope: _scr_simple_scope_target)

      content =
        if _scr_recurring_master?
          # Recurring masters can't be patched per-id over the wire — the
          # host expands the rrule into per-occurrence client ids (e.g.
          # "{master}-{date}"), but the master's broadcast carries the
          # bare master id. A per-id update would either miss every
          # occurrence (no match) or, with upsert, add a phantom event
          # at the master's start while the existing occurrences stay
          # stale. Punt to a refetch: every subscribed client re-pulls
          # its visible range from the host's event source. Same fix
          # covers EXDATE additions (excluded_dates) and rrule edits.
          StimulusCalendarRails::TurboStreams.event_refetch(calendar: resource)
        else
          case op
          when :add
            StimulusCalendarRails::TurboStreams.event_add(
              calendar: resource, event_id: id, payload: send(self.class._scr_simple_payload),
              optimistic_id: _scr_optimistic_id,
            )
          when :update
            StimulusCalendarRails::TurboStreams.event_update(
              calendar: resource, event_id: id, attributes: send(self.class._scr_simple_payload),
              optimistic_id: _scr_optimistic_id,
            )
          when :remove
            StimulusCalendarRails::TurboStreams.event_remove(
              calendar: resource, event_id: id
            )
          end
        end

      ::Turbo::StreamsChannel.broadcast_stream_to(*tokens, content: content)
    end

    # True when this record is the master of a recurring series. Used
    # to switch from per-id update to op=refetch so virtual
    # occurrences on the client (with synthetic ids like
    # "{master_id}-{iso_date}") get reloaded from the host's event
    # source instead of being silently skipped.
    def _scr_recurring_master?
      respond_to?(:recurring?) && recurring?
    end

    def _scr_simple_scope_target
      scope = self.class._scr_simple_scope
      return nil unless scope
      scope.respond_to?(:call) ? scope.call(self) : scope
    end
  end
end
