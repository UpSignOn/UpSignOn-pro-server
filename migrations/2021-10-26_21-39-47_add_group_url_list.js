//2021-10-26_21-39-47_add_group_url_list

exports.up = function (db) {
  return db.query(
    'ALTER TABLE url_list ADD COLUMN group_id INTEGER NOT NULL DEFAULT 1, ADD CONSTRAINT fk_url_list_group FOREIGN KEY(group_id) REFERENCES groups(id) ON DELETE CASCADE',
  );
};

exports.down = function (db) {
  return db.query('ALTER TABLE url_list DROP COLUMN group_id');
};
