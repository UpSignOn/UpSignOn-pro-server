//2021-10-26_21-41-05_add_group_users

exports.up = function (db) {
  return db.query(
    'ALTER TABLE users ADD COLUMN group_id INTEGER NOT NULL DEFAULT 1, ADD CONSTRAINT fk_users_group FOREIGN KEY(group_id) REFERENCES groups(id) ON DELETE CASCADE',
  );
};

exports.down = function (db) {
  return db.query('ALTER TABLE users DROP COLUMN group_id');
};
