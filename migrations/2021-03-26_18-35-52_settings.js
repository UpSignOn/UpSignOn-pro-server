//2021-03-26_18-35-52_settings

exports.up = function (db) {
  return db
    .query('CREATE TABLE IF NOT EXISTS settings (key varchar(120), value boolean)')
    .then(() => {
      return db.query(
        "INSERT INTO settings (key, value) VALUES ('DISABLE_MANUAL_VALIDATION_FOR_PASSWORD_FORGOTTEN', false)",
      );
    });
};

exports.down = function (db) {
  return db.query('DROP TABLE IF EXISTS settings');
};
