//2021-09-24_10-07-41_new_sharing_system

exports.up = function (db) {
  return db.query('ALTER TABLE shared_accounts ADD COLUMN aes_encrypted_data TEXT');
};

exports.down = function (db) {
  return db.query('ALTER TABLE shared_accounts DROP COLUMN aes_encrypted_data');
};
