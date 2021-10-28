//2021-10-26_21-20-33_add_group_changed_emails

exports.up = function (db) {
  return db.query(
    'ALTER TABLE changed_emails ADD COLUMN group_id SMALLINT NOT NULL DEFAULT 1, ADD CONSTRAINT fk_changed_email_group FOREIGN KEY(group_id) REFERENCES groups(id) ON DELETE CASCADE',
  );
};

exports.down = function (db) {
  return db.query('ALTER TABLE changed_emails DROP COLUMN group_id');
};
