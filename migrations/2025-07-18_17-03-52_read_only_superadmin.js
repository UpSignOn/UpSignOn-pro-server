//2025-07-18_17-03-52_read_only_superadmin

exports.up = function (db) {
  return db.query('ALTER TABLE admins ADD COLUMN is_read_only_superadmin BOOLEAN DEFAULT false');
};

exports.down = function (db) {
  return db.query('ALTER TABLE admins DROP COLUMN is_read_only_superadmin');
};
