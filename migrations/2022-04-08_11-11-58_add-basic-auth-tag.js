//2022-04-08_11-11-58_add-basic-auth-tag

exports.up = function (db) {
  return db.query('ALTER TABLE url_list ADD COLUMN uses_basic_auth BOOL');
};

exports.down = function (db) {
  return db.query('ALTER TABLE url_list DROP COLUMN uses_basic_auth');
};
