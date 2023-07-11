//2023-07-11_13-13-18_rename_duplicate

exports.up = function (db) {
  return db.query('ALTER TABLE data_stats RENAME COLUMN nb_accounts_with_duplicate_password TO nb_accounts_with_duplicated_password');
};

exports.down = function (db) {
  return db.query('ALTER TABLE data_stats RENAME COLUMN nb_accounts_with_duplicated_password TO nb_accounts_with_duplicate_password');
};
