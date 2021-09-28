//2021-09-28_16-45-27_revert_domain_list

exports.up = function (db) {
  return db.query('ALTER TABLE users DROP COLUMN domain_list');
};

exports.down = function (db) {
  return db.query('ALTER TABLE users ADD COLUMN domain_list TEXT');
};
