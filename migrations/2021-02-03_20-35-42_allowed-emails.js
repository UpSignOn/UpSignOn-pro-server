//2021-02-03_20-35-41_allowed-emails

exports.up = function (db) {
  return db.query('CREATE TABLE IF NOT EXISTS allowed_emails (pattern varchar(64))');
};

exports.down = function (db) {
  return db.query('DROP TABLE IF EXISTS allowed_emails');
};
