class CreateEvents < ActiveRecord::Migration[7.2]
  def change
    create_table :events do |t|
      t.string   :title,      null: false
      t.datetime :starts_at,  null: false
      t.datetime :ends_at,    null: false
      t.boolean  :all_day,    null: false, default: false
      t.string   :color
      t.references :resource, foreign_key: true
      t.integer  :lock_version, null: false, default: 0
      t.timestamps
    end

    add_index :events, :starts_at
    add_index :events, :ends_at
  end
end
