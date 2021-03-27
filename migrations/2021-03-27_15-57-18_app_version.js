//2021-03-27_15-57-18_app_version

exports.up = function (db) {
  return db.query('ALTER TABLE user_devices ADD COLUMN app_version varchar(20)');
};

exports.down = function (db) {
  return db.query('ALTER TABLE user_devices DROP COLUMN app_version');
};
