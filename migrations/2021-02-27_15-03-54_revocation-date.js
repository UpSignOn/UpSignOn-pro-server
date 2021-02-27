//2021-02-27_15-03-54_revocation-date

exports.up = function (db) {
  return db.query('ALTER TABLE user_devices ADD revocation_date timestamp without time zone');
};

exports.down = function (db) {
  return db.query('ALTER TABLE user_devices DROP revocation_date');
};
