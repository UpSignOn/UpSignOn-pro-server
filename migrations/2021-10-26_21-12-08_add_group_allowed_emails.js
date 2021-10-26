//2021-10-26_21-12-08_add_group_allowed_emails

exports.up = function (db) {
  return db.query(
    'ALTER TABLE allowed_emails ADD COLUMN group_id INTEGER NOT NULL DEFAULT 1, ADD CONSTRAINT fk_allowed_email_group FOREIGN KEY(group_id) REFERENCES groups(id) ON DELETE CASCADE',
  );
};

exports.down = function (db) {
  return db.query('ALTER TABLE allowed_emails DROP COLUMN group_id');
};
