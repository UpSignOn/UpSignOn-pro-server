//2021-10-26_21-28-17_add_group_shared_account_users

exports.up = function (db) {
  return db.query(
    'ALTER TABLE shared_account_users ADD COLUMN group_id INTEGER NOT NULL DEFAULT 1, ADD CONSTRAINT fk_shared_account_users_group FOREIGN KEY(group_id) REFERENCES groups(id) ON DELETE CASCADE',
  );
};

exports.down = function (db) {
  return db.query('ALTER TABLE shared_account_users DROP COLUMN group_id');
};
