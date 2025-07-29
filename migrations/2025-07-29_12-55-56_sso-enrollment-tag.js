//2025-07-29_12-55-56_sso-enrollment-tag

exports.up = function (db) {
  return db.query(
    "ALTER TABLE user_devices ADD COLUMN IF NOT EXISTS enrollment_method VARCHAR DEFAULT 'email'",
  );
};

exports.down = function (db) {
  return db.query('ALTER TABLE user_devices DROP COLUMN IF EXISTS enrollment_method');
};
