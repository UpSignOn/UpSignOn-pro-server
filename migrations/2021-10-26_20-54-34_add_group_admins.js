//2021-10-26_20-54-34_add_group_admins

exports.up = function (db) {
  return db.query(
    'ALTER TABLE admins ADD COLUMN group_id SMALLINT, ADD CONSTRAINT fk_admin_group FOREIGN KEY(group_id) REFERENCES groups(id) ON DELETE CASCADE',
  );
};

exports.down = function (db) {
  return db.query('ALTER TABLE admins DROP COLUMN group_id');
};
