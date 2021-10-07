//2021-10-07_17-59-13_add_cascades_data_stats

exports.up = function (db) {
  return db.query(
    'ALTER TABLE data_stats DROP CONSTRAINT stat_user_id, ADD CONSTRAINT stat_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE',
  );
};

exports.down = function (db) {
  return db.query(
    'ALTER TABLE data_stats DROP CONSTRAINT stat_user_id, ADD CONSTRAINT stat_user_id FOREIGN KEY (user_id) REFERENCES users(id)',
  );
};
