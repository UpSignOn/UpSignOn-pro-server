//2024-07-17_09-34-42_drop-v5

exports.up = async function (db) {
  // DELETE vaults that have not migrated
  await db.query('DELETE FROM users WHERE encrypted_data_2 IS NULL');
  await db.query('DROP TABLE shared_account_users');
  await db.query('DROP TABLE shared_accounts');
  await db.query('DROP TABLE shared_folders');
  await db.query(
    'ALTER TABLE user_devices DROP COLUMN encrypted_password_backup, DROP COLUMN device_public_key, DROP COLUMN access_code_hash',
  );
  await db.query('ALTER TABLE users DROP COLUMN encrypted_data, DROP COLUMN sharing_public_key');
};

exports.down = function (db) {
  return db.query();
};
