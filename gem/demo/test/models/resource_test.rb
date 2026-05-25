require "test_helper"

class ResourceTest < ActiveSupport::TestCase
  test "is valid with a title" do
    assert Resource.new(title: "Room A").valid?
  end

  test "requires a title" do
    r = Resource.new
    assert_not r.valid?
    assert_includes r.errors[:title], "can't be blank"
  end

  test "supports nested resources" do
    parent = Resource.create!(title: "Building 1")
    child  = Resource.create!(title: "Room A", parent: parent)
    assert_equal [child], parent.children.to_a
    assert_equal parent, child.parent
  end
end
