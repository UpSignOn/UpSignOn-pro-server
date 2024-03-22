//2024-03-22_15-21-50_add_os_family_and_name

exports.up = function (db) {
  return db.query(
    'ALTER TABLE user_devices ADD COLUMN IF NOT EXISTS os_family TEXT, ALTER COLUMN device_type TYPE TEXT',
  );
};

exports.down = function (db) {
  return db.query('ALTER TABLE user_devices DROP COLUMN IF EXISTS os_family');
};
