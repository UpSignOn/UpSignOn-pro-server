//2025-07-30_15-22-53_rename-groups-to-banks

exports.up = async function (db) {
  await db.query('ALTER TABLE groups RENAME TO banks');
  await db.query('ALTER TABLE admin_groups RENAME TO admin_banks');

  await db.query('ALTER TABLE admin_banks RENAME COLUMN group_id TO bank_id');
  await db.query('ALTER TABLE allowed_emails RENAME COLUMN group_id TO bank_id');
  await db.query('ALTER TABLE changed_emails RENAME COLUMN group_id TO bank_id');
  await db.query('ALTER TABLE event_logs RENAME COLUMN group_id TO bank_id');
  await db.query('ALTER TABLE password_reset_request RENAME COLUMN group_id TO bank_id');
  await db.query('ALTER TABLE pwd_stats_evolution RENAME COLUMN group_id TO bank_id');
  await db.query('ALTER TABLE shared_account_users RENAME COLUMN group_id TO bank_id');
  await db.query('ALTER TABLE shared_accounts RENAME COLUMN group_id TO bank_id');
  await db.query('ALTER TABLE shared_folders RENAME COLUMN group_id TO bank_id');
  await db.query('ALTER TABLE shared_vault_recipients RENAME COLUMN group_id TO bank_id');
  await db.query('ALTER TABLE shared_vaults RENAME COLUMN group_id TO bank_id');
  await db.query('ALTER TABLE url_list RENAME COLUMN group_id TO bank_id');
  await db.query('ALTER TABLE user_devices RENAME COLUMN group_id TO bank_id');
  await db.query('ALTER TABLE users RENAME COLUMN group_id TO bank_id');
};

exports.down = async function (db) {
  await db.query('ALTER TABLE admin_banks RENAME COLUMN bank_id TO group_id');
  await db.query('ALTER TABLE allowed_emails RENAME COLUMN bank_id TO group_id');
  await db.query('ALTER TABLE changed_emails RENAME COLUMN bank_id TO group_id');
  await db.query('ALTER TABLE event_logs RENAME COLUMN bank_id TO group_id');
  await db.query('ALTER TABLE password_reset_request RENAME COLUMN bank_id TO group_id');
  await db.query('ALTER TABLE pwd_stats_evolution RENAME COLUMN bank_id TO group_id');
  await db.query('ALTER TABLE shared_account_users RENAME COLUMN bank_id TO group_id');
  await db.query('ALTER TABLE shared_accounts RENAME COLUMN bank_id TO group_id');
  await db.query('ALTER TABLE shared_folders RENAME COLUMN bank_id TO group_id');
  await db.query('ALTER TABLE shared_vault_recipients RENAME COLUMN bank_id TO group_id');
  await db.query('ALTER TABLE shared_vaults RENAME COLUMN bank_id TO group_id');
  await db.query('ALTER TABLE url_list RENAME COLUMN bank_id TO group_id');
  await db.query('ALTER TABLE user_devices RENAME COLUMN bank_id TO group_id');
  await db.query('ALTER TABLE users RENAME COLUMN bank_id TO group_id');

  await db.query('ALTER TABLE admin_banks RENAME TO admin_groups');
  await db.query('ALTER TABLE banks RENAME TO groups');
};
