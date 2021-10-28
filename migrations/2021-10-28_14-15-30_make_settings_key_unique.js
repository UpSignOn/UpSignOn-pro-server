//2021-10-28_14-15-30_make_settings_key_unique

exports.up = function (db) {
  return db.query('ALTER TABLE settings ADD CONSTRAINT setting_key_unique UNIQUE(key)');
};

exports.down = function (db) {
  return db.query('ALTER TABLE settings DROP CONSTRAINT setting_key_unique');
};
