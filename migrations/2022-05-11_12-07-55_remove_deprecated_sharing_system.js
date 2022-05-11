//2022-05-11_12-07-55_remove_deprecated_sharing_system

exports.up = function (db) {
  return db.query('ALTER TABLE shared_account_users DROP COLUMN encrypted_password');
};

exports.down = function (db) {
  return db.query('ALTER TABLE shared_account_users ADD COLUMN encrypted_password TEXT');
};
