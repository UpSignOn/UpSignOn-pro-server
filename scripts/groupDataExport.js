/* eslint-disable @typescript-eslint/no-var-requires */
const groupId = parseInt(process.argv[2]);
const filePath = process.argv[3];

if (typeof groupId !== 'number') {
  console.log('GroupId parameter missing.');
  console.log('Usage: node ./scripts/groupDataExport.js 2 path/to/data/file');
  process.exit(1);
}
if (!filePath) {
  console.log('File path parameter missing.');
  console.log('Usage: node ./scripts/groupDataExport.js 2 path/to/data/file');
  process.exit(1);
}

const path = require('path');
const db = require(path.join(__dirname, './dbMigrationConnect'));
const fs = require('fs');

async function exportDb() {
  try {
    await db.connect();
    const admins = await db.query('SELECT * FROM admins');
    const admin_groups = await db.query('SELECT * FROM admin_groups WHERE group_id=$1', [groupId]);
    const allowed_emails = await db.query('SELECT * FROM allowed_emails WHERE group_id=$1', [
      groupId,
    ]);
    // const data_stats = await db.query('SELECT * FROM data_stats WHERE group_id=$1', [groupId]);
    // const password_reset_request = await db.query(
    //   'SELECT * FROM password_reset_request WHERE group_id=$1',
    //   [groupId],
    // );
    const users = await db.query('SELECT * FROM users WHERE group_id=$1', [groupId]);
    const shared_accounts = await db.query('SELECT * FROM shared_accounts WHERE group_id=$1', [
      groupId,
    ]);
    const shared_account_users = await db.query(
      'SELECT * FROM shared_account_users WHERE group_id=$1',
      [groupId],
    );
    const shared_folders = await db.query('SELECT * FROM shared_folders WHERE group_id=$1', [
      groupId,
    ]);
    const shared_vault_recipients = await db.query(
      'SELECT * FROM shared_vault_recipients WHERE group_id=$1',
      [groupId],
    );
    const shared_vaults = await db.query('SELECT * FROM shared_vaults WHERE group_id=$1', [
      groupId,
    ]);
    const url_list = await db.query('SELECT * FROM url_list WHERE group_id=$1', [groupId]);
    // const user_devices = await db.query('SELECT * FROM user_devices WHERE group_id=$1', [groupId]);
    fs.writeFileSync(
      filePath,
      JSON.stringify({
        admins: admins.rows,
        admin_groups: admin_groups.rows,
        allowed_emails: allowed_emails.rows,
        // data_stats: data_stats.rows,
        // password_reset_request: password_reset_request.rows,
        shared_vault_recipients: shared_vault_recipients.rows,
        shared_vaults: shared_vaults.rows,
        // user_devices: user_devices.rows,
        users: users.rows,
        shared_accounts: shared_accounts.rows,
        shared_account_users: shared_account_users.rows,
        shared_folders: shared_folders.rows,
        url_list: url_list.rows,
      }),
    );
    await db.release();
  } catch (e) {
    console.log(e);
  }
}

exportDb();
