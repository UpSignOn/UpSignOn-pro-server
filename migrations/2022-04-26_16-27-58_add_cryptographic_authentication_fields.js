//2022-04-26_16-27-58_add_cryptographic_authentication_fields

exports.up = function (db) {
  return db.query(
    'ALTER TABLE user_devices ADD COLUMN device_public_key TEXT, ADD COLUMN session_auth_challenge TEXT, ADD COLUMN session_auth_challenge_exp_time timestamp, ADD COLUMN password_challenge_error_count SMALLINT DEFAULT 0, ADD COLUMN password_challenge_blocked_until timestamp',
  );
};

exports.down = function (db) {
  return db.query(
    'ALTER TABLE user_devices DROP COLUMN device_public_key, DROP COLUMN session_auth_challenge, DROP COLUMN session_auth_challenge_exp_time, DROP COLUMN password_challenge_error_count, DROP COLUMN password_challenge_blocked_until',
  );
};
