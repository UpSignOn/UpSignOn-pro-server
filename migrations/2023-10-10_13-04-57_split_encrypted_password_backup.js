//2023-10-10_13-04-57_split_encrypted_password_backup

exports.up = async function (db) {
  await db.query('ALTER TABLE user_devices ADD COLUMN encrypted_password_backup_2 TEXT');
  await db.query('UPDATE user_devices SET encrypted_password_backup_2=encrypted_password_backup');
};

exports.down = function (db) {
  return db.query('ALTER TABLE user_devices DROP COLUMN encrypted_password_backup_2');
};
