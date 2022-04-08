//2022-04-08_18-40-38_remove_size_constraint_encrypted_aes_key

exports.up = function (db) {
  return db.query('ALTER TABLE shared_account_users ALTER COLUMN encrypted_aes_key TYPE TEXT');
};

exports.down = function (db) {
  return;
};
