//2021-10-26_21-39-47_add_group_url_list

exports.up = async function (db) {
  await db.query(
    'ALTER TABLE url_list ADD COLUMN group_id SMALLINT NOT NULL DEFAULT 1, ADD CONSTRAINT fk_url_list_group FOREIGN KEY(group_id) REFERENCES groups(id) ON DELETE CASCADE',
  );

  // now that all preexisting data have been associated to a group, let's remove the default group
  await db.query('ALTER TABLE url_list ALTER COLUMN group_id DROP DEFAULT');
};

exports.down = function (db) {
  return db.query('ALTER TABLE url_list DROP COLUMN group_id');
};
