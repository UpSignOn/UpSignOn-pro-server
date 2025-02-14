//2025-02-07_15-08-13_upgrade_sharing_accesses

exports.up = async function (db) {
  await db.query(
    "ALTER TABLE shared_vault_recipients ADD COLUMN IF NOT EXISTS access_level VARCHAR(30) NOT NULL DEFAULT 'blind'",
  );
  await db.query("UPDATE shared_vault_recipients SET access_level=\'owner\' WHERE is_manager=true");
  await db.query(
    "UPDATE shared_vault_recipients SET access_level=\'reader\' WHERE is_manager=false",
  );
};

exports.down = function (db) {
  return;
};
