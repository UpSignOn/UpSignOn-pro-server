//2021-10-26_21-22-49_add_group_data_stats
exports.up = async function (db) {
  await db.query(
    'ALTER TABLE data_stats ADD COLUMN group_id SMALLINT NOT NULL DEFAULT 1, ADD CONSTRAINT fk_data_stats_group FOREIGN KEY(group_id) REFERENCES groups(id) ON DELETE CASCADE',
  );

  // now that all preexisting data have been associated to a group, let's remove the default group
  await db.query('ALTER TABLE data_stats ALTER COLUMN group_id DROP DEFAULT');
};

exports.down = function (db) {
  return db.query('ALTER TABLE data_stats DROP COLUMN group_id');
};
