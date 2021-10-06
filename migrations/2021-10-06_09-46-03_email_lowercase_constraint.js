//2021-10-06_09-46-03_email_lowercase_constraint

exports.up = function (db) {
  return db.query('UPDATE users SET email=LOWER(email)').then(function () {
    return db.query(
      'ALTER TABLE users ADD CONSTRAINT users_email_lowercase_constraint CHECK (email = LOWER(email))',
    );
  });
};

exports.down = function (db) {
  return db.query('ALTER TABLE users DROP CONSTRAINT users_email_lowercase_constraint');
};
