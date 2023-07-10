//2023-07-10_15-02-42_stats-v2

exports.up = function(db) {
  return db.query("ALTER TABLE data_stats ADD COLUMN shared_vault_id INTEGER");
}

exports.down = function(db) {
  return db.query("ALTER TABLE data_stats DROP COLUMN shared_vault_id");
}
