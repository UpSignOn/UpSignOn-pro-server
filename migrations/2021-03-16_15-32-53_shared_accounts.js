//2021-03-16_15-32-53_shared_accounts

exports.up = function (db) {
  return db.query(
    'CREATE TABLE IF NOT EXISTS shared_accounts (' +
      'id SERIAL PRIMARY KEY,' +
      'url varchar(128),' +
      'name varchar(64),' +
      'created_at timestamp without time zone DEFAULT current_timestamp(0)' +
      ')',
  );
};

exports.down = function (db) {
  return db.query('DROP TABLE IF EXISTS shared_accounts');
};
