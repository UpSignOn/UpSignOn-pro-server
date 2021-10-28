//2021-10-26_21-22-49_add_group_data_stats
exports.up = function (db) {
  return db.query(
    'ALTER TABLE data_stats ADD COLUMN group_id SMALLINT NOT NULL DEFAULT 1, ADD CONSTRAINT fk_data_stats_group FOREIGN KEY(group_id) REFERENCES groups(id) ON DELETE CASCADE',
  );
};

exports.down = function (db) {
  return db.query('ALTER TABLE data_stats DROP COLUMN group_id');
};
