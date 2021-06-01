//2021-05-31_22-38-50_store_domains

exports.up = function (db) {
  return db.query('ALTER TABLE users ADD COLUMN domain_list TEXT');
};

exports.down = function (db) {
  return db.query('ALTER TABLE users DROP COLUMN domain_list');
};
