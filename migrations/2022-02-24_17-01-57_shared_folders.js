//2022-02-24_17-01-57_shared_folders

exports.up = function (db) {
  return db.query(
    'CREATE TABLE IF NOT EXISTS shared_folders (id SERIAL PRIMARY KEY, name VARCHAR, group_id SMALLINT NOT NULL, CONSTRAINT fk_shared_folders_group FOREIGN KEY(group_id) REFERENCES groups(id) ON DELETE CASCADE)',
  );
};

exports.down = function (db) {
  return db.query('DROP TABLE IF EXISTS shared_folders');
};
