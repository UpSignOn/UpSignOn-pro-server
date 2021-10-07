//2021-10-07_18-09-08_add_cascades_shared_account

exports.up = function (db) {
  return db.query(
    'ALTER TABLE shared_account_users DROP CONSTRAINT fk_shared_account_users_foreign_account, ADD CONSTRAINT fk_shared_account_users_foreign_account FOREIGN KEY (shared_account_id) REFERENCES shared_accounts(id) ON DELETE CASCADE',
  );
};

exports.down = function (db) {
  return db.query(
    'ALTER TABLE shared_account_users DROP CONSTRAINT fk_shared_account_users_foreign_account, ADD CONSTRAINT fk_shared_account_users_foreign_account FOREIGN KEY (shared_account_id) REFERENCES shared_accounts(id)',
  );
};
