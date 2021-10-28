//2021-10-26_21-39-15_add_group_shared_accounts

exports.up = async function (db) {
  await db.query(
    'ALTER TABLE shared_accounts ADD COLUMN group_id SMALLINT NOT NULL DEFAULT 1, ADD CONSTRAINT fk_shared_accounts_group FOREIGN KEY(group_id) REFERENCES groups(id) ON DELETE CASCADE',
  );

  // now that all preexisting data have been associated to a group, let's remove the default group
  await db.query('ALTER TABLE shared_accounts ALTER COLUMN group_id DROP DEFAULT');
};

exports.down = function (db) {
  return db.query('ALTER TABLE shared_accounts DROP COLUMN group_id');
};
