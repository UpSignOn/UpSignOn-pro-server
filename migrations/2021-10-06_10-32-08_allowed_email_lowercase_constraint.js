//2021-10-06_10-32-08_allowed_email_lowercase_constraint

exports.up = function (db) {
  return db.query('UPDATE allowed_emails SET pattern=LOWER(pattern)').then(function () {
    return db.query(
      'ALTER TABLE allowed_emails ADD CONSTRAINT allowed_email_lowercase_constraint CHECK (pattern = LOWER(pattern))',
    );
  });
};

exports.down = function (db) {
  return db.query('ALTER TABLE users DROP CONSTRAINT allowed_email_lowercase_constraint');
};
