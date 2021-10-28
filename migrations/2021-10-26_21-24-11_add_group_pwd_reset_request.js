//2021-10-26_21-24-11_add_group_pwd_reset_request

exports.up = function (db) {
  return db.query(
    'ALTER TABLE password_reset_request ADD COLUMN group_id SMALLINT NOT NULL DEFAULT 1, ADD CONSTRAINT fk_password_reset_request_group FOREIGN KEY(group_id) REFERENCES groups(id) ON DELETE CASCADE',
  );
};

exports.down = function (db) {
  return db.query('ALTER TABLE password_reset_request DROP COLUMN group_id');
};
