//2022-05-06_17-26-56_alter_date_types

exports.up = async function (db) {
  await db.query(
    'ALTER TABLE users ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE, ALTER COLUMN updated_at TYPE TIMESTAMP WITH TIME ZONE',
  );
  await db.query(
    'ALTER TABLE user_devices ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE, ALTER COLUMN revocation_date TYPE TIMESTAMP WITH TIME ZONE',
  );
  await db.query(
    'ALTER TABLE password_reset_request ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE',
  );
  await db.query(
    'ALTER TABLE shared_accounts ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE',
  );
  await db.query('ALTER TABLE data_stats ALTER COLUMN date TYPE TIMESTAMP WITH TIME ZONE');
  await db.query('ALTER TABLE usage_logs ALTER COLUMN date TYPE TIMESTAMP WITH TIME ZONE');
  await db.query(
    'ALTER TABLE changed_emails ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE',
  );
  await db.query(
    'ALTER TABLE admins ALTER COLUMN token_expires_at TYPE TIMESTAMP WITH TIME ZONE, ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE',
  );
};

exports.down = function (db) {
  return;
};
