//2021-02-03_14-08-15_users

exports.up = function (db) {
  return db.query(
    'CREATE TABLE users (' +
      'id SERIAL,' +
      'email varchar(128) PRIMARY KEY,' +
      'encrypted_data TEXT,' +
      'created_at timestamp without time zone DEFAULT current_timestamp(0)' +
      ')',
  );
};

exports.down = function (db) {
  return db.query('DROP TABLE users');
};
