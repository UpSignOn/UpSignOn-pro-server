//2021-10-28_20-49-04_change_unique_user_email

exports.up = async function (db) {
  await db.query('ALTER TABLE users DROP CONSTRAINT users_email_key');
  await db.query('ALTER TABLE users ADD CONSTRAINT users_email_group_key UNIQUE(email, group_id)');
};

exports.down = async function (db) {
  await db.query('ALTER TABLE users DROP CONSTRAINT users_email_group_key');
  await db.query('ALTER TABLE users ADD CONSTRAINT users_email_key UNIQUE(email)');
};
