//2021-10-26_21-40-49_add_group_user_devices

exports.up = async function (db) {
  await db.query(
    'ALTER TABLE user_devices ADD COLUMN group_id SMALLINT NOT NULL DEFAULT 1, ADD CONSTRAINT fk_user_devices_group FOREIGN KEY(group_id) REFERENCES groups(id) ON DELETE CASCADE',
  );

  // now that all preexisting data have been associated to a group, let's remove the default group
  await db.query('ALTER TABLE user_devices ALTER COLUMN group_id DROP DEFAULT');
};

exports.down = function (db) {
  return db.query('ALTER TABLE user_devices DROP COLUMN group_id');
};
