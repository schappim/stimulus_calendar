require "stimulus_calendar_rails/version"
require "stimulus_calendar_rails/engine"

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

  def self.tenant_stream_token
    return nil unless defined?(ActsAsTenant) && ActsAsTenant.respond_to?(:current_tenant)
    tenant = ActsAsTenant.current_tenant
    tenant ? "scr-tenant:#{tenant.class.name}:#{tenant.id}" : nil
  end

  def self.streamables_for(resource, *extra)
    [tenant_stream_token, "scr-calendar:#{resource}", *extra].compact
  end
end
