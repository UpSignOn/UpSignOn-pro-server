//2024-04-03_13-18-48_remember_admin_that_granted_pwd_reset_request

exports.up = function (db) {
  return db.query('ALTER TABLE password_reset_request ADD COLUMN IF NOT EXISTS granted_by TEXT');
};

exports.down = function (db) {
  return db.query('ALTER TABLE password_reset_request DROP COLUMN IF EXISTS granted_by');
};
