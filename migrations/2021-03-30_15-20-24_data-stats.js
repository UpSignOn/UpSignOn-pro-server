//2021-03-30_15-20-24_data-stats

exports.up = function (db) {
  return db.query(
    'CREATE TABLE IF NOT EXISTS data_stats (' +
      'id SERIAL PRIMARY KEY,' +
      'user_id INTEGER,' +
      'date timestamp without time zone DEFAULT current_timestamp(0),' +
      'nb_accounts INTEGER,' +
      'nb_codes INTEGER,' +
      'nb_accounts_strong INTEGER,' +
      'nb_accounts_medium INTEGER,' +
      'nb_accounts_weak INTEGER' +
      ')',
  );
};

exports.down = function (db) {
  return db.query('DROP TABLE IF EXISTS data_stats');
};
