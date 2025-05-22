//2025-05-23_10-41-10_safe_browser_setup_option

exports.up = function (db) {
  return db.query('ALTER TABLE user_devices ADD COLUMN IF NOT EXISTS use_safe_browser_setup BOOL');
};

exports.down = function (db) {};
