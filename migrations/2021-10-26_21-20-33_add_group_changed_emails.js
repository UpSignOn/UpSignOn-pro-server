//2021-10-26_21-20-33_add_group_changed_emails

exports.up = async function (db) {
  await db.query(
    'ALTER TABLE changed_emails ADD COLUMN group_id SMALLINT NOT NULL DEFAULT 1, ADD CONSTRAINT fk_changed_email_group FOREIGN KEY(group_id) REFERENCES groups(id) ON DELETE CASCADE',
  );

  // now that all preexisting data have been associated to a group, let's remove the default group
  await db.query('ALTER TABLE changed_emails ALTER COLUMN group_id DROP DEFAULT');
};

exports.down = function (db) {
  return db.query('ALTER TABLE changed_emails DROP COLUMN group_id');
};
