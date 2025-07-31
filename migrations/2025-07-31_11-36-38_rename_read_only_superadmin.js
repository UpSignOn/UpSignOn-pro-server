//2025-07-31_11-36-38_rename_read_only_superadmin

exports.up = async function (db) {
  await db.query(
    "CREATE TYPE admin_roles AS ENUM ('superadmin', 'restricted_superadmin', 'admin')",
  );
  await db.query(
    "ALTER TABLE admins ADD COLUMN IF NOT EXISTS admin_role admin_roles NOT NULL DEFAULT 'admin'",
  );
  await db.query(`
    UPDATE admins
    SET admin_role = CASE
      WHEN is_superadmin = true THEN 'superadmin'::admin_roles
      ELSE 'admin'::admin_roles
    END
  `);
  await db.query('ALTER TABLE admins DROP COLUMN IF EXISTS is_read_only_superadmin');
  await db.query('ALTER TABLE admins DROP COLUMN IF EXISTS is_superadmin');
};

exports.down = async function (db) {
  await db.query(
    'ALTER TABLE admins ADD COLUMN IF NOT EXISTS is_read_only_superadmin BOOLEAN NOT NULL DEFAULT false',
  );
  await db.query(
    'ALTER TABLE admins ADD COLUMN IF NOT EXISTS is_superadmin BOOLEAN NOT NULL DEFAULT false',
  );
  await db.query(`
    UPDATE admins
    SET is_superadmin = CASE
      WHEN admin_role = 'superadmin' THEN true
      ELSE false
    END,
    is_read_only_superadmin = false
  `);
  await db.query('ALTER TABLE admins DROP COLUMN IF EXISTS admin_role');
  await db.query('DROP TYPE admin_roles');
};
