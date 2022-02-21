//2022-02-21_10-50-25_admins_belong_to_several_groups

exports.up = async function (db) {
  await db.query(
    'CREATE TABLE IF NOT EXISTS admin_groups (admin_id uuid, group_id smallint, CONSTRAINT fk_admin_id FOREIGN KEY(admin_id) REFERENCES admins(id) ON DELETE CASCADE, CONSTRAINT fk_group_id FOREIGN KEY(group_id) REFERENCES groups(id) ON DELETE CASCADE, CONSTRAINT unique_admin_group UNIQUE(admin_id,group_id))',
  );
  await db.query(
    'INSERT INTO admin_groups (admin_id, group_id) SELECT id as admin_id, group_id FROM admins WHERE NOT is_superadmin',
  );
  await db.query('ALTER TABLE admins DROP COLUMN group_id');
};

exports.down = async function (db) {
  await db.query(
    'ALTER TABLE admins ADD COLUMN group_id SMALLINT, ADD CONSTRAINT fk_admin_group FOREIGN KEY(group_id) REFERENCES groups(id) ON DELETE CASCADE',
  );
  await db.query(
    'UPDATE admins SET group_id=(SELECT group_id FROM admin_groups WHERE admin_id = admins.id LIMIT 1) WHERE is_superadmin=false',
  );
  await db.query('DROP TABLE admin_groups');
};
