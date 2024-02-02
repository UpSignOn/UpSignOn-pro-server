//2024-02-02_15-07-15_drop_data_stats_ref_to_user

exports.up = function (db) {
  return db.query('ALTER TABLE data_stats DROP CONSTRAINT IF EXISTS stat_user_id');
};

exports.down = function (db) {
  return db.query(
    'ALTER TABLE data_stats DROP CONSTRAINT IF EXISTS stat_user_id, ADD CONSTRAINT stat_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE',
  );
};
