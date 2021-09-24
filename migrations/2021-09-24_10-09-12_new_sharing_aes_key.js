//2021-09-24_10-09-12_new_sharing_aes_key

exports.up = function (db) {
  return db.query('ALTER TABLE shared_account_users ADD COLUMN encrypted_aes_key VARCHAR(344)');
};

exports.down = function (db) {
  return db.query('ALTER TABLE shared_account_users DROP COLUMN encrypted_aes_key');
};
