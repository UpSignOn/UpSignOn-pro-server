/* eslint-disable @typescript-eslint/no-var-requires */
const groupId = parseInt(process.argv[2]);
const filePath = process.argv[3];
if (typeof groupId !== 'number') {
  console.log('GroupId parameter missing.');
  console.log('Usage: node ./scripts/groupDataImport.js 2 path/to/data/file');
  process.exit(1);
}
if (!filePath) {
  console.log('File path parameter missing.');
  console.log('Usage: node ./scripts/groupDataImport.js 2 path/to/data/file');
  process.exit(1);
}

const path = require('path');
const fs = require('fs');
const db = require(path.join(__dirname, './dbMigrationConnect'));

const dataString = fs.readFileSync(filePath);
const data = JSON.parse(dataString);

async function importFunction() {
  await db.connect();

  for (var i = 0; i < data.users.length; i++) {
    const u = data.users[i];
    const insertedUser = await db.query(
      'INSERT INTO users (email, encrypted_data, created_at, updated_at, sharing_public_key, group_id) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id',
      [u.email, u.encrypted_data, u.created_at, u.updated_at, u.sharing_public_key, groupId],
    );
    const newId = insertedUser.rows[0].id;
    data.sharedAccountUsers = data.sharedAccountUsers.map((sau) => {
      if (sau.user_id === u.id) {
        return {
          ...sau,
          newUserId: newId,
        };
      } else {
        return sau;
      }
    });
  }

  for (var i = 0; i < data.sharedFolders.length; i++) {
    const sf = data.sharedFolders[i];
    const insertedSharedFolder = await db.query(
      'INSERT INTO shared_folders (name, group_id) VALUES ($1,$2) RETURNING id',
      [sf.name, groupId],
    );
    const newId = insertedSharedFolder.rows[0].id;
    data.sharedAccounts = data.sharedAccounts.map((sa) => {
      if (sa.shared_folder_id === sf.id) {
        return {
          ...sa,
          newSharedFolderId: newId,
        };
      } else {
        return sa;
      }
    });
  }

  for (var i = 0; i < data.sharedAccounts.length; i++) {
    const sa = data.sharedAccounts[i];
    const insertedAcc = await db.query(
      'INSERT INTO shared_accounts (url, name, login, type, created_at, aes_encrypted_data, shared_folder_id, group_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id',
      [
        sa.url,
        sa.name,
        sa.login,
        sa.type,
        sa.created_at,
        sa.aes_encrypted_data,
        sa.newSharedFolderId,
        groupId,
      ],
    );
    const newId = insertedAcc.rows[0].id;
    data.sharedAccountUsers = data.sharedAccountUsers.map((sau) => {
      if (sau.shared_account_id === sa.id) {
        return {
          ...sau,
          newSharedAccountId: newId,
        };
      } else {
        return sau;
      }
    });
  }

  for (var i = 0; i < data.sharedAccountUsers.length; i++) {
    const sau = data.sharedAccountUsers[i];
    await db.query(
      'INSERT INTO shared_account_users (shared_account_id, user_id, is_manager, encrypted_password, created_at, encrypted_aes_key, group_id) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      [
        sau.newSharedAccountId,
        sau.newUserId,
        sau.is_manager,
        sau.encrypted_password,
        sau.created_at,
        sau.encrypted_aes_key,
        groupId,
      ],
    );
  }

  for (var i = 0; i < data.urlList.length; i++) {
    const url = data.urlList[i];
    await db.query(
      'INSERT INTO url_list (displayed_name, signin_url, password_change_url, group_id) VALUES ($1,$2,$3,$4)',
      [url.displayed_name, url.signin_url, url.password_change_url, groupId],
    );
  }

  await db.release();
}

importFunction();
