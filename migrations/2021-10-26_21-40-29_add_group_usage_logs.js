//2021-10-26_21-40-29_add_group_usage_logs

exports.up = async function (db) {
  await db.query(
    'ALTER TABLE usage_logs ADD COLUMN group_id SMALLINT NOT NULL DEFAULT 1, ADD CONSTRAINT fk_usage_logs_group FOREIGN KEY(group_id) REFERENCES groups(id) ON DELETE CASCADE',
  );

  // now that all preexisting data have been associated to a group, let's remove the default group
  await db.query('ALTER TABLE usage_logs ALTER COLUMN group_id DROP DEFAULT');
};

exports.down = function (db) {
  return db.query('ALTER TABLE usage_logs DROP COLUMN group_id');
};
