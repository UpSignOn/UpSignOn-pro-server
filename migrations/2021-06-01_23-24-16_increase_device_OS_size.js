//2021-06-01_23-24-16_increase_device_os_size

exports.up = function (db) {
  return db.query('ALTER TABLE user_devices ALTER COLUMN os_version TYPE varchar(64)');
};

exports.down = function () {
  return;
};
