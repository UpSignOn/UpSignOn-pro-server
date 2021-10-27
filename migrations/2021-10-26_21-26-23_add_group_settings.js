//2021-10-26_21-26-23_add_group_settings

exports.up = function (db) {
  return db.query(
    'ALTER TABLE settings ADD COLUMN group_id INTEGER, ADD CONSTRAINT fk_settings_group FOREIGN KEY(group_id) REFERENCES groups(id) ON DELETE CASCADE',
  );
};

exports.down = function (db) {
  return db.query('ALTER TABLE settings DROP COLUMN group_id');
};
