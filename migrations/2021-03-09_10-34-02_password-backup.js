//2021-03-09_10-34-02_password-backup

exports.up = function (db) {
  return db.query('ALTER TABLE user_devices ADD COLUMN encrypted_password_backup VARCHAR(400)');
};

exports.down = function (db) {
  return db.query('ALTER TABLE user_devices DROP COLUMN encrypted_password_backup');
};
