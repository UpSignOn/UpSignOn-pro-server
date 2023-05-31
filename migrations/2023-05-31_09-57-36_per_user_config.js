//2023-05-31_09-57-36_per_user_config

exports.up = function (db) {
  return db.query(`ALTER TABLE users
  ADD COLUMN IF NOT EXISTS allowed_to_export BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS allowed_offline BOOLEAN DEFAULT false
`);
}

exports.down = function (db) {
  return db.query();
}
