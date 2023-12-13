//2023-12-13_14-12-16_move_device_last_session_date

exports.up = function (db) {
  return db.query('ALTER TABLE user_devices ADD COLUMN last_sync_date TIMESTAMP WITH TIME ZONE');
};

exports.down = function (db) {
  return db.query('ALTER TABLE user_devices DROP COLUMN last_sync_date');
};
