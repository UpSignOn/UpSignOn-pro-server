//2021-03-26_18-35-52_settings

exports.up = function (db) {
  return db.query('CREATE TABLE IF NOT EXISTS settings (key varchar(120), value boolean)');
};

exports.down = function (db) {
  return db.query('DROP TABLE IF EXISTS settings');
};
