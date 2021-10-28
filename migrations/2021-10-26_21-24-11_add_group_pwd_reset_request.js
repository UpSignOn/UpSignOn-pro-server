//2021-10-26_21-24-11_add_group_pwd_reset_request

exports.up = async function (db) {
  await db.query(
    'ALTER TABLE password_reset_request ADD COLUMN group_id SMALLINT NOT NULL DEFAULT 1, ADD CONSTRAINT fk_password_reset_request_group FOREIGN KEY(group_id) REFERENCES groups(id) ON DELETE CASCADE',
  );

  // now that all preexisting data have been associated to a group, let's remove the default group
  await db.query('ALTER TABLE password_reset_request ALTER COLUMN group_id DROP DEFAULT');
};

exports.down = function (db) {
  return db.query('ALTER TABLE password_reset_request DROP COLUMN group_id');
};
