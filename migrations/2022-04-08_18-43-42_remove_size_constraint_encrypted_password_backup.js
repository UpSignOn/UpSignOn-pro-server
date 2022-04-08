//2022-04-08_18-43-42_remove_size_constraint_encrypted_password_backup

exports.up = function (db) {
  return db.query('ALTER TABLE user_devices ALTER COLUMN encrypted_password_backup TYPE TEXT');
};

exports.down = function (db) {
  return;
};
