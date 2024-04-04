//2024-04-04_14-34-00_add_ms_entra_user_id

exports.up = function (db) {
  return db.query(
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS ms_entra_id UUID, ADD COLUMN IF NOT EXISTS deactivated BOOLEAN',
  );
};

exports.down = function (db) {
  return db.query(
    'ALTER TABLE users DROP COLUMN IF EXISTS ms_entra_id, DROP COLUMN IF EXISTS deactivated',
  );
};
