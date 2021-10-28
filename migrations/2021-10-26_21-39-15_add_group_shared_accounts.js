//2021-10-26_21-39-15_add_group_shared_accounts

exports.up = function (db) {
  return db.query(
    'ALTER TABLE shared_accounts ADD COLUMN group_id SMALLINT NOT NULL DEFAULT 1, ADD CONSTRAINT fk_shared_accounts_group FOREIGN KEY(group_id) REFERENCES groups(id) ON DELETE CASCADE',
  );
};

exports.down = function (db) {
  return db.query('ALTER TABLE shared_accounts DROP COLUMN group_id');
};
