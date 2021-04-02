//2021-04-02_14-26-01_add_constraints_stats

exports.up = function (db) {
  return db.query(
    'ALTER TABLE data_stats ADD CONSTRAINT stat_user_id FOREIGN KEY(user_id) REFERENCES users(id)',
  );
};

exports.down = function (db) {
  return db.query('ALTER TABLE data_stats DROP CONSTRAINT stat_user_id');
};
