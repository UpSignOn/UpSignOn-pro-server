//2022-01-25_11-20-51_change_device_validation_code_type

exports.up = function (db) {
  return db.query('ALTER TABLE user_devices ALTER COLUMN authorization_code TYPE VARCHAR');
};

exports.down = function (db) {
  return db.query('ALTER TABLE user_devices ALTER COLUMN authorization_code TYPE UUID');
};
