//2021-03-02_12-17-28_os-version-length

exports.up = function (db) {
  return db.query('ALTER TABLE user_devices ALTER COLUMN os_version TYPE varchar(32)');
};

exports.down = function (db) {
  return db.query('ALTER TABLE user_devices ALTER COLUMN os_version TYPE varchar(16)');
};
