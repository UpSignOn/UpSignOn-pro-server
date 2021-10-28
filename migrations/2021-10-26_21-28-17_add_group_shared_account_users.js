//2021-10-26_21-28-17_add_group_shared_account_users

exports.up = async function (db) {
  await db.query(
    'ALTER TABLE shared_account_users ADD COLUMN group_id SMALLINT NOT NULL DEFAULT 1, ADD CONSTRAINT fk_shared_account_users_group FOREIGN KEY(group_id) REFERENCES groups(id) ON DELETE CASCADE',
  );

  // now that all preexisting data have been associated to a group, let's remove the default group
  await db.query('ALTER TABLE shared_account_users ALTER COLUMN group_id DROP DEFAULT');
};

exports.down = function (db) {
  return db.query('ALTER TABLE shared_account_users DROP COLUMN group_id');
};
