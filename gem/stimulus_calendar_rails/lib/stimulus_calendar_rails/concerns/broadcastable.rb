require "active_support/concern"

module StimulusCalendarRails
  # Mixin for Active Record models backing a calendar. Once included and
  # wired with `broadcasts_calendar`, every create/update/destroy
  # automatically publishes a Turbo Stream broadcast on the calendar's
  # tenant-scoped stream:
  #
  #   create  → calendar-event op=add
  #   update  → calendar-event op=update with changed fields
  #   destroy → calendar-event op=remove
  #
  # Usage:
  #
  #     class Event < ApplicationRecord
  #       include StimulusCalendarRails::Broadcastable
  #       broadcasts_calendar EventCalendar
  #     end
  module Broadcastable
    extend ActiveSupport::Concern

    included do
      attr_accessor :_scr_optimistic_id
    end

    class_methods do
      def broadcasts_calendar(calendar_class)
        @stimulus_calendar_class = calendar_class
        after_create_commit  { stimulus_calendar_broadcast_add }
        after_update_commit  { stimulus_calendar_broadcast_update }
        after_destroy_commit { stimulus_calendar_broadcast_remove }
      end

      def stimulus_calendar_class
        @stimulus_calendar_class
      end
    end

    def stimulus_calendar_streamables
      StimulusCalendarRails.streamables_for(self.class.stimulus_calendar_class.resource_name)
    end

    def stimulus_calendar_broadcast_add
      calendar = self.class.stimulus_calendar_class.new
      message  = StimulusCalendarRails::TurboStreams.event_add(
        calendar: calendar.class.resource_name, event_id: id,
        payload: calendar.event_to_h(self), optimistic_id: _scr_optimistic_id,
      )
      stimulus_calendar_broadcast(message)
    end

    def stimulus_calendar_broadcast_update
      calendar_class = self.class.stimulus_calendar_class
      calendar = calendar_class.new
      changed_field_names = previous_changes.keys.map(&:to_sym)
      fields = calendar_class.fields_registry || {}
      changed_fields = fields.values.select { |f| changed_field_names.include?(f.name) }
      attrs = changed_fields.each_with_object({}) do |f, acc|
        acc[f.name] = calendar.send(:serialize_value, calendar.field_value(self, f), f)
      end
      return if attrs.empty?
      message = StimulusCalendarRails::TurboStreams.event_update(
        calendar: calendar_class.resource_name, event_id: id,
        attributes: attrs, optimistic_id: _scr_optimistic_id,
      )
      stimulus_calendar_broadcast(message)
    end

    def stimulus_calendar_broadcast_remove
      calendar_class = self.class.stimulus_calendar_class
      message = StimulusCalendarRails::TurboStreams.event_remove(
        calendar: calendar_class.resource_name, event_id: id,
      )
      stimulus_calendar_broadcast(message)
    end

    private

    def stimulus_calendar_broadcast(message)
      ::Turbo::StreamsChannel.broadcast_stream_to(*stimulus_calendar_streamables, content: message)
    end
  end
end
