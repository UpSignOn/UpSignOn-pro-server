//2021-04-02_15-10-33_add_shared_account_user_id

exports.up = function (db) {
  return db.query('ALTER TABLE shared_account_users ADD id SERIAL');
};

exports.down = function (db) {
  return db.query('ALTER TABLE shared_account_users DROP id');
};
