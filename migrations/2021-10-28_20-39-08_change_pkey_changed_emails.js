//2021-10-28_20-39-08_change_pkey_changed_emails

exports.up = async function (db) {
  await db.query('ALTER TABLE changed_emails DROP CONSTRAINT changed_emails_pkey');
  await db.query('ALTER TABLE changed_emails ADD PRIMARY KEY (old_email, group_id)');
};

exports.down = async function (db) {
  await db.query('ALTER TABLE changed_emails DROP CONSTRAINT changed_emails_pkey');
  await db.query('ALTER TABLE changed_emails ADD PRIMARY KEY (old_email)');
};
