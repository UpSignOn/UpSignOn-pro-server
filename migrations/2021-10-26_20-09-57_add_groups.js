//2021-10-26_20-09-57_add_groups

exports.up = async function (db) {
  await db.query(
    'CREATE TABLE IF NOT EXISTS groups (id SMALLSERIAL PRIMARY KEY, name TEXT, settings JSON)',
  );
  const currentName = process.env.ORGANISATION_NAME || process.env.DISPLAY_NAME_IN_APP;
  if (currentName) {
    await db.query('INSERT INTO groups (name) VALUES($1)', [currentName]);
  }
};

exports.down = function (db) {
  return db.query('DROP TABLE IF EXISTS groups');
};
