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
    const url_list = await db.query('SELECT * FROM url_list WHERE group_id=$1', [groupId]);
    fs.writeFileSync(
      filePath,
      JSON.stringify({
        users: users.rows,
        sharedAccounts: shared_accounts.rows,
        sharedAccountUsers: shared_account_users.rows,
        sharedFolders: shared_folders.rows,
        urlList: url_list.rows,
      }),
    );
    await db.release();
  } catch (e) {
    console.log(e);
  }
}

exportDb();
