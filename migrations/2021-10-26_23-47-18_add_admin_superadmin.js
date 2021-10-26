//2021-10-26_23-47-18_add_admin_superadmin

exports.up = async function (db) {
  await db.query('ALTER TABLE admins ADD COLUMN is_superadmin BOOL DEFAULT false');
  await db.query('UPDATE admins SET is_superadmin=true');
};

exports.down = function (db) {
  return db.query('ALTER TABLE admins DROP COLUMN is_superadmin');
};
