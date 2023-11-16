//2023-11-16_22-13-10_csv_export_not_allowed_by_default

exports.up = function (db) {
  return db.query('ALTER TABLE users ALTER COLUMN allowed_to_export SET DEFAULT false');
};

exports.down = function () {
  return;
};
