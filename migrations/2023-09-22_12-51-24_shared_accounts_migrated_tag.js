//2023-09-22_12-51-24_shared_accounts_migrated_tag

exports.up = function(db) {
  return db.query("ALTER TABLE shared_accounts ADD COLUMN IF NOT EXISTS is_migrated BOOL DEFAULT false");
}

exports.down = function(db) {
  return;
}
