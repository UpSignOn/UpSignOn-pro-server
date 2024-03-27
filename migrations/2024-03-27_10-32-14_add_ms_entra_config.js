//2024-03-27_10-32-14_add_ms_entra_config

exports.up = function (db) {
  return db.query('ALTER TABLE groups ADD COLUMN IF NOT EXISTS ms_entra_config json');
};

exports.down = function (db) {
  return db.query('ALTER TABLE groups DROP COLUMN IF EXISTS ms_entra_config');
};
