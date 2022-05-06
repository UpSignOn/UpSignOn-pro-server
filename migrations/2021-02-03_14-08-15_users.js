//2021-02-03_14-08-15_users

exports.up = function (db) {
  return db.query(
    'CREATE TABLE IF NOT EXISTS users (' +
      'id SERIAL PRIMARY KEY,' +
      'email varchar(64) UNIQUE,' +
      'encrypted_data TEXT,' +
      'created_at timestamp with time zone DEFAULT current_timestamp(0),' +
      'updated_at timestamp with time zone DEFAULT current_timestamp(0)' +
      ')',
  );
};

exports.down = function (db) {
  return db.query('DROP TABLE IF EXISTS users');
};
