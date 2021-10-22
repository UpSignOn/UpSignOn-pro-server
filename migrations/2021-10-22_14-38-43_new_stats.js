//2021-10-22_14-38-43_new_stats

exports.up = function (db) {
  return db.query(
    'ALTER TABLE data_stats ADD COLUMN IF NOT EXISTS nb_accounts_with_no_password INTEGER DEFAULT 0, ADD COLUMN IF NOT EXISTS nb_accounts_red INTEGER DEFAULT 0, ADD COLUMN IF NOT EXISTS nb_accounts_orange INTEGER DEFAULT 0, ADD COLUMN IF NOT EXISTS nb_accounts_green INTEGER DEFAULT 0',
  );
};

exports.down = function (db) {
  // This change does not break anything, no need to revert it
  return;
};
