//2021-10-07_18-10-16_add_cascades_shared_user

exports.up = function (db) {
  return db.query(
    'ALTER TABLE shared_account_users DROP CONSTRAINT fk_shared_account_users_foreign_user, ADD CONSTRAINT fk_shared_account_users_foreign_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE',
  );
};

exports.down = function (db) {
  return db.query(
    'ALTER TABLE shared_account_users DROP CONSTRAINT fk_shared_account_users_foreign_user, ADD CONSTRAINT fk_shared_account_users_foreign_user FOREIGN KEY (user_id) REFERENCES users(id)',
  );
};
