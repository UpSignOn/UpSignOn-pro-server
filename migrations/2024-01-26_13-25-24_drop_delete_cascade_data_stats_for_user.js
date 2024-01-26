//2024-01-26_13-25-24_drop_delete_cascade_data_stats_for_user

exports.up = function (db) {
  return db.query(
    'ALTER TABLE data_stats DROP CONSTRAINT stat_user_id, ADD CONSTRAINT stat_user_id FOREIGN KEY (user_id) REFERENCES users(id)',
  );
};

exports.down = function (db) {
  return db.query(
    'ALTER TABLE data_stats DROP CONSTRAINT stat_user_id, ADD CONSTRAINT stat_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE',
  );
};
