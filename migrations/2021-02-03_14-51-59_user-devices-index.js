//2021-02-03_14-51-59_user-devices-index

exports.up = function (db) {
  return db.query('CREATE INDEX user_device_index ON user_devices (user_id, device_unique_id)');
};

exports.down = function (db) {
  return db.query('DROP INDEX user_device_index');
};
