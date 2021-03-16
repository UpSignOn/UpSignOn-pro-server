//2021-03-16_15-36-49_shared_account_users

exports.up = function (db) {
  return db.query(
    'CREATE TABLE IF NOT EXISTS shared_account_users (' +
      'shared_account_id integer,' +
      'user_id integer,' +
      'is_manager boolean,' +
      'encrypted_password TEXT,' +
      'created_at timestamp without time zone DEFAULT current_timestamp(0)' +
      ')',
  );
};

exports.down = function (db) {
  return db.query('DROP TABLE IF EXISTS shared_account_users');
};
