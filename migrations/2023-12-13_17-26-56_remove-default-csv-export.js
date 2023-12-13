//2023-12-13_17-26-56_remove-default-csv-export

exports.up = async function (db) {
  await db.query('ALTER TABLE users ALTER COLUMN allowed_to_export DROP DEFAULT');
  await db.query('UPDATE users SET allowed_to_export=null');
  const groupsRes = await db.query('SELECT id, settings FROM groups');
  for (let i = 0; i < groupsRes.rowCount; i++) {
    const g = groupsRes.rows[i];
    if (g.settings?.DISABLE_CSV_EXPORT !== null) {
      let newSettings = { ...g.settings, ALLOWED_TO_EXPORT: !g.DISABLE_CSV_EXPORT };
      delete newSettings.DISABLE_CSV_EXPORT;
      await db.query('UPDATE groups SET settings=$2 WHERE id=$1', [g.id, newSettings]);
    }
  }
};

exports.down = function (db) {
  return db.query('ALTER TABLE users ALTER COLUMN allowed_to_export SET DEFAULT false');
};
