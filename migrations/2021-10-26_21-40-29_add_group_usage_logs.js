//2021-10-26_21-40-29_add_group_usage_logs

exports.up = function (db) {
  return db.query(
    'ALTER TABLE usage_logs ADD COLUMN group_id SMALLINT NOT NULL DEFAULT 1, ADD CONSTRAINT fk_usage_logs_group FOREIGN KEY(group_id) REFERENCES groups(id) ON DELETE CASCADE',
  );
};

exports.down = function (db) {
  return db.query('ALTER TABLE usage_logs DROP COLUMN group_id');
};
