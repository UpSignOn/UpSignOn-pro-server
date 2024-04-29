//2024-04-19_16-39-15_redirect_server_url

exports.up = function (db) {
  return db.query(
    'ALTER TABLE groups ADD COLUMN IF NOT EXISTS redirect_url TEXT, ADD COLUMN stop_this_instance BOOLEAN',
  );
};

exports.down = function (db) {
  return db.query(
    'ALTER TABLE groups DROP COLUMN IF EXISTS redirect_url, DROP COLUMN IF EXISTS stop_this_instance',
  );
};
