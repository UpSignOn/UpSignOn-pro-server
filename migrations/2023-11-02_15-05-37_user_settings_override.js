//2023-11-02_15-05-37_user_settings_override

exports.up = async function (db) {
  await db.query('ALTER TABLE users ALTER COLUMN allowed_to_export DROP DEFAULT');
  await db.query('UPDATE users SET allowed_to_export=null');
  await db.query(
    'ALTER TABLE users DROP COLUMN IF EXISTS allowed_offline, ADD COLUMN IF NOT EXISTS allowed_offline_desktop BOOLEAN, ADD COLUMN IF NOT EXISTS allowed_offline_mobile BOOLEAN',
  );
};

exports.down = function (db) {
  return db.query(
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS allowed_offline BOOLEAN, DROP COLUMN IF EXISTS allowed_offline_mobile, DROP COLUMN IF EXISTS allowed_offline_desktop',
  );
};
