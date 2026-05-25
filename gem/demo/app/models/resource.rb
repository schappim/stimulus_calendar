class Resource < ApplicationRecord
  belongs_to :parent, class_name: "Resource", optional: true
  has_many :children, class_name: "Resource", foreign_key: :parent_id, dependent: :destroy
  has_many :events, dependent: :nullify

  validates :title, presence: true
end
