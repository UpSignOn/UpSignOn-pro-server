//2021-05-31_22-35-30_count_duplicates

exports.up = function (db) {
  return db.query('ALTER TABLE data_stats ADD COLUMN nb_accounts_with_duplicate_password INTEGER');
};

exports.down = function (db) {
  return db.query('ALTER TABLE data_stats DROP COLUMN nb_accounts_with_duplicate_password');
};
