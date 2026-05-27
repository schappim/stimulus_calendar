require "stimulus_calendar_rails/version"
require "stimulus_calendar_rails/engine"
require "stimulus_calendar_rails/field"
require "stimulus_calendar_rails/calendar"
require "stimulus_calendar_rails/turbo_streams_helper"
require "stimulus_calendar_rails/concerns/broadcastable"
require "stimulus_calendar_rails/concerns/simple_broadcastable"

module StimulusCalendarRails
  class << self
    attr_writer :parent_controller

    def parent_controller
      @parent_controller ||= "ApplicationController"
    end

    def mount_path
      @mount_path || "/calendars"
    end

    def mount_path=(path)
      @mount_path = path.to_s.sub(%r{/+\z}, "")
    end
  end

  def self.registry
    @registry ||= {}
  end

  def self.register_calendar(resource, klass)
    registry[resource.to_s] = klass
  end

  def self.lookup_calendar(resource)
    registry[resource.to_s] or
      raise ArgumentError, "No calendar registered for resource #{resource.inspect}. " \
                           "Did you define a Calendar subclass and reference it from a view?"
  end

  # Build a token for the tenant on a given record / explicit scope, or
  # fall back to ActsAsTenant.current_tenant. `scope` can be an
  # ActiveRecord row (anything with #id) or already a stringified token.
  def self.tenant_stream_token(scope: nil)
    target = scope
    if target.nil? && defined?(ActsAsTenant) && ActsAsTenant.respond_to?(:current_tenant)
      target = ActsAsTenant.current_tenant
    end
    return nil unless target
    return target if target.is_a?(String)
    "scr-tenant:#{target.class.name}:#{target.id}"
  end

  def self.streamables_for(resource, *extra, scope: nil)
    [tenant_stream_token(scope: scope), "scr-calendar:#{resource}", *extra].compact
  end
end
