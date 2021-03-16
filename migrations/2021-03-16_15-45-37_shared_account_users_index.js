//2021-03-16_15-45-37_shared_account_users_index

exports.up = function (db) {
  return db.query('CREATE INDEX shared_account_users_index ON shared_account_users (user_id)');
};

exports.down = function (db) {
  return db.query('DROP INDEX IF EXISTS shared_account_users_index');
};
