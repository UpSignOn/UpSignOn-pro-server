//2021-02-27_13-35-07_add-device-type-os

exports.up = function (db) {
  return db.query(
    'ALTER TABLE user_devices ADD device_type VARCHAR(32), ADD os_version VARCHAR(16)',
  );
};

exports.down = function (db) {
  return db.query('ALTER TABLE user_devices DROP device_type, DROP os_version');
};
