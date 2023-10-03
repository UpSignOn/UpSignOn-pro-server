//2023-10-03_22-37-42_unmark_shared_accounts_as_migrated

exports.up = function (db) {
  return db.query('UPDATE shared_accounts SET is_migrated = false');
};

exports.down = function () {
  return;
};
