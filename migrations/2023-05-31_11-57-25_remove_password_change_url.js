//2023-05-31_11-57-25_remove_password_change_url

exports.up = function (db) {
  return db.query("ALTER TABLE url_list DROP COLUMN IF EXISTS password_change_url");
}

exports.down = function (db) {
  return db.query("ALTER TABLE url_list ADD COLUMN password_change_url TYPE TEXT");
}
