//2021-10-15_17-29-31_settings-text-value

exports.up = function (db) {
  return db.query("ALTER TABLE settings ALTER COLUMN value TYPE JSON USING 'false'");
};

exports.down = function (db) {
  return;
};
