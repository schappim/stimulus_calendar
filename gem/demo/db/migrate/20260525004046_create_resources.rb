class CreateResources < ActiveRecord::Migration[7.2]
  def change
    create_table :resources do |t|
      t.string :title, null: false
      t.references :parent, foreign_key: { to_table: :resources }
      t.timestamps
    end
  end
end
