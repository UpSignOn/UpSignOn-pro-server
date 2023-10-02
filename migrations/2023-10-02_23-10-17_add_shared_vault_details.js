//2023-10-02_23-10-17_add_shared_vault_details

exports.up = function (db) {
  return db.query('ALTER TABLE shared_vaults ADD COLUMN content_details JSON');
};

exports.down = function (db) {
  return db.query('ALTER TABLE shared_vaults DROP COLUMN content_details');
};
