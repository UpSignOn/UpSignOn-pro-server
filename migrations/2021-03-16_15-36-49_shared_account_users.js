//2021-03-16_15-36-49_shared_account_users

exports.up = function (db) {
  return db.query(
    'CREATE TABLE IF NOT EXISTS shared_account_users (' +
      'shared_account_id integer,' +
      'user_id integer,' +
      'is_manager boolean,' +
      'encrypted_password TEXT,' +
      'created_at timestamp without time zone DEFAULT current_timestamp(0),' +
      'PRIMARY KEY (shared_account_id, user_id),' +
      'CONSTRAINT fk_shared_account_users_foreign_user FOREIGN KEY(user_id) REFERENCES users(id),' +
      'CONSTRAINT fk_shared_account_users_foreign_account FOREIGN KEY(shared_account_id) REFERENCES shared_accounts(id)' +
      ')',
  );
};

exports.down = function (db) {
  return db.query('DROP TABLE IF EXISTS shared_account_users');
};
