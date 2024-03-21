//2024-03-21_15-35-34_add_device_install_type

exports.up = function (db) {
  return db.query('ALTER TABLE user_devices ADD COLUMN IF NOT EXISTS install_type TEXT');
};

exports.down = function (db) {
  return db.query('ALTER TABLE user_devices DROP COLUMN IF EXISTS install_type');
};
