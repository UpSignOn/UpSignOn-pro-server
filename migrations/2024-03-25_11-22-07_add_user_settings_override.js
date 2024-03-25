//2024-03-25_11-22-07_add_user_settings_override

exports.up = function (db) {
  return db.query(
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS settings_override JSONB DEFAUlT '{}'",
  );
};

exports.down = function (db) {
  return db.query('ALTER TABLE users DROP COLUMN IF EXISTS settings_override');
};
