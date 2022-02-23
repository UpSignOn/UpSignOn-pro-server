//2022-02-23_13-07-49_clean-stats

exports.up = function (db) {
  await db.query(
    'DELETE FROM data_stats WHERE nb_accounts != nb_accounts_red+nb_accounts_orange+nb_accounts_green+nb_accounts_with_no_password',
  );
  await db.query('DELETE FROM data_stats WHERE nb_accounts = 0 AND nb_codes = 0');
  await db.query('DELETE FROM data_stats WHERE nb_accounts_with_duplicate_password IS NULL');
  await db.query('DELETE FROM data_stats WHERE nb_accounts_with_duplicate_password < 0');
  await db.query('DELETE FROM data_stats WHERE nb_accounts_with_no_password < 0');
};

exports.down = function (db) {
  return;
};
