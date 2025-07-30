/* eslint-disable @typescript-eslint/no-var-requires */
const bankId = parseInt(process.argv[2]);
const filePath = process.argv[3];

if (typeof bankId !== 'number') {
  console.log('BankId parameter missing.');
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
    const admin_banks = await db.query('SELECT * FROM admin_banks WHERE bank_id=$1', [bankId]);
    const allowed_emails = await db.query('SELECT * FROM allowed_emails WHERE bank_id=$1', [
      bankId,
    ]);
    // const data_stats = await db.query('SELECT * FROM data_stats WHERE bank_id=$1', [bankId]);
    // const password_reset_request = await db.query(
    //   'SELECT * FROM password_reset_request WHERE bank_id=$1',
    //   [bankId],
    // );
    const users = await db.query('SELECT * FROM users WHERE bank_id=$1', [bankId]);
    const shared_vault_recipients = await db.query(
      'SELECT * FROM shared_vault_recipients WHERE bank_id=$1',
      [bankId],
    );
    const shared_vaults = await db.query('SELECT * FROM shared_vaults WHERE bank_id=$1', [bankId]);
    const url_list = await db.query('SELECT * FROM url_list WHERE bank_id=$1', [bankId]);
    const user_devices = await db.query('SELECT * FROM user_devices WHERE bank_id=$1', [bankId]);
    fs.writeFileSync(
      filePath,
      JSON.stringify({
        admins: admins.rows,
        admin_banks: admin_banks.rows,
        allowed_emails: allowed_emails.rows,
        // data_stats: data_stats.rows,
        // password_reset_request: password_reset_request.rows,
        shared_vault_recipients: shared_vault_recipients.rows,
        shared_vaults: shared_vaults.rows,
        user_devices: user_devices.rows,
        users: users.rows,
        url_list: url_list.rows,
      }),
    );
    await db.release();
  } catch (e) {
    console.log(e);
  }
}

exportDb();
