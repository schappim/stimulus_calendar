class Event < ApplicationRecord
  include StimulusCalendarRails::Broadcastable
  broadcasts_calendar EventCalendar

  belongs_to :resource, optional: true

  self.locking_column = :lock_version

  validates :title, presence: true
  validates :starts_at, :ends_at, presence: true
  validate  :ends_after_starts

  scope :between, ->(range_start, range_end) {
    where("ends_at > ? AND starts_at < ?", range_start, range_end)
  }

  private

  def ends_after_starts
    return if starts_at.blank? || ends_at.blank?
    errors.add(:ends_at, "must be after starts_at") if ends_at <= starts_at
  end
end
