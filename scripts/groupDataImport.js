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

  // ADMINS
  for (var i = 0; i < data.admins.length; i++) {
    const row = data.admins[i];
    await db.query(
      'INSERT INTO admins (id, email, password_hash, created_at) VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING',
      [row.id, row.email, row.password_hash, row.created_at],
    );
  }

  // ADMIN GROUPS
  for (var i = 0; i < data.admin_groups.length; i++) {
    const row = data.admin_groups[i];
    await db.query('INSERT INTO admin_groups (admin_id, group_id) VALUES ($1,$2)', [
      row.admin_id,
      groupId,
    ]);
  }

  // ALLOWED EMAILS
  for (var i = 0; i < data.allowed_emails.length; i++) {
    const row = data.allowed_emails[i];
    await db.query('INSERT INTO allowed_emails (pattern, group_id) VALUES ($1,$2)', [
      row.pattern,
      groupId,
    ]);
  }

  // USERS
  for (var i = 0; i < data.users.length; i++) {
    const u = data.users[i];
    const insertedUser = await db.query(
      `INSERT INTO users (
        email,
        encrypted_data,
        created_at,
        updated_at,
        sharing_public_key,
        group_id,
        nb_accounts,
        nb_codes,
        nb_accounts_strong,
        nb_accounts_medium,
        nb_accounts_weak,
        nb_accounts_with_duplicated_password,
        nb_accounts_with_no_password,
        nb_accounts_red,
        nb_accounts_orange,
        nb_accounts_green,
        encrypted_data_2,
        sharing_public_key_2,
        allowed_to_export,
        allowed_offline_mobile,
        allowed_offline_desktop) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21) RETURNING id`,
      [
        u.email,
        u.encrypted_data,
        u.created_at,
        u.updated_at,
        u.sharing_public_key,
        groupId,
        u.nb_accounts,
        u.nb_codes,
        u.nb_accounts_strong,
        u.nb_accounts_medium,
        u.nb_accounts_weak,
        u.nb_accounts_with_duplicated_password,
        u.nb_accounts_with_no_password,
        u.nb_accounts_red,
        u.nb_accounts_orange,
        u.nb_accounts_green,
        u.encrypted_data_2,
        u.sharing_public_key_2,
        u.allowed_to_export,
        u.allowed_offline_mobile,
        u.allowed_offline_desktop,
      ],
    );
    const newId = insertedUser.rows[0].id;
    data.shared_account_users = data.shared_account_users.map((sau) => {
      if (sau.user_id === u.id) {
        return {
          ...sau,
          newUserId: newId,
        };
      } else {
        return sau;
      }
    });
    // data.data_stats = data.data_stats.map((row) => {
    //   if (row.user_id === u.id) {
    //     return {
    //       ...row,
    //       newUserId: newId,
    //     };
    //   } else {
    //     return row;
    //   }
    // });
    data.shared_vault_recipients = data.shared_vault_recipients.map((row) => {
      if (row.user_id === u.id) {
        return {
          ...row,
          newUserId: newId,
        };
      } else {
        return row;
      }
    });
  }

  // SHARED FOLDERS
  for (var i = 0; i < data.shared_folders.length; i++) {
    const sf = data.shared_folders[i];
    const insertedSharedFolder = await db.query(
      'INSERT INTO shared_folders (name, group_id) VALUES ($1,$2) RETURNING id',
      [sf.name, groupId],
    );
    const newId = insertedSharedFolder.rows[0].id;
    data.shared_accounts = data.shared_accounts.map((sa) => {
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

  // SHARED ACCOUNTS
  for (var i = 0; i < data.shared_accounts.length; i++) {
    const sa = data.shared_accounts[i];
    const insertedAcc = await db.query(
      'INSERT INTO shared_accounts (url, name, login, type, created_at, aes_encrypted_data, shared_folder_id, group_id, is_migrated) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id',
      [
        sa.url,
        sa.name,
        sa.login,
        sa.type,
        sa.created_at,
        sa.aes_encrypted_data,
        sa.newSharedFolderId,
        groupId,
        sa.is_migrated,
      ],
    );
    const newId = insertedAcc.rows[0].id;
    data.shared_account_users = data.shared_account_users.map((sau) => {
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

  // SHARED_ACCOUNT_USERS
  for (var i = 0; i < data.shared_account_users.length; i++) {
    const sau = data.shared_account_users[i];
    await db.query(
      'INSERT INTO shared_account_users (shared_account_id, user_id, is_manager, created_at, encrypted_aes_key, group_id) VALUES ($1,$2,$3,$4,$5,$6)',
      [
        sau.newSharedAccountId,
        sau.newUserId,
        sau.is_manager,
        sau.created_at,
        sau.encrypted_aes_key,
        groupId,
      ],
    );
  }

  // URL LIST
  for (var i = 0; i < data.url_list.length; i++) {
    const url = data.url_list[i];
    await db.query(
      'INSERT INTO url_list (displayed_name, signin_url, group_id, uses_basic_auth) VALUES ($1,$2,$3,$4)',
      [url.displayed_name, url.signin_url, groupId, url.uses_basic_auth],
    );
  }

  // SHARED VAULTS
  for (var i = 0; i < data.shared_vaults.length; i++) {
    const sv = data.shared_vaults[i];
    const insertedVault = await db.query(
      `INSERT INTO shared_vaults (
        group_id,
        name,
        encrypted_data,
        last_updated_at,
        created_at,
        nb_accounts,
        nb_codes,
        nb_accounts_strong,
        nb_accounts_with_duplicated_password,
        nb_accounts_with_no_password,
        nb_accounts_red,
        nb_accounts_orange,
        nb_accounts_green,
        content_details
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING id`,
      [
        groupId,
        sv.name,
        sv.encrypted_data,
        sv.last_updated_at,
        sv.created_at,
        sv.nb_accounts,
        sv.nb_codes,
        sv.nb_accounts_strong,
        sv.nb_accounts_with_duplicated_password,
        sv.nb_accounts_with_no_password,
        sv.nb_accounts_red,
        sv.nb_accounts_orange,
        sv.nb_accounts_green,
        sv.content_details,
      ],
    );
    const newId = insertedVault.rows[0].id;
    data.shared_vault_recipients = data.shared_vault_recipients.map((svr) => {
      if (svr.shared_vault_id === sv.id) {
        return {
          ...svr,
          newSharedVaultId: newId,
        };
      } else {
        return svr;
      }
    });
    // data.data_stats = data.data_stats.map((ds) => {
    //   if (ds.shared_vault_id === sv.id) {
    //     return {
    //       ...ds,
    //       newSharedVaultId: newId,
    //     };
    //   } else {
    //     return ds;
    //   }
    // });
  }

  // SHARED VAULT RECIPIENTS
  for (var i = 0; i < data.shared_vault_recipients.length; i++) {
    const svr = data.shared_vault_recipients[i];
    await db.query(
      'INSERT INTO shared_vault_recipients (shared_vault_id, user_id, encrypted_shared_vault_key, is_manager, group_id, created_at) VALUES ($1,$2,$3,$4,$5,$6)',
      [
        svr.newSharedVaultId,
        svr.newUserId,
        svr.encrypted_shared_vault_key,
        svr.is_manager,
        groupId,
        svr.created_at,
      ],
    );
  }

  // DATA STATS
  // let's drop this import since the curve will change from before due to potential missing refrences for deleted users and shared_vaults
  // for (var i = 0; i < data.data_stats.length; i++) {
  //   const row = data.data_stats[i];
  //   await db.query(
  //     `INSERT INTO data_stats (
  //       user_id,
  //       date,
  //       nb_accounts,
  //       nb_codes,
  //       nb_accounts_strong,
  //       nb_accounts_medium,
  //       nb_accounts_weak,
  //       nb_accounts_with_duplicated_password,
  //       nb_accounts_with_no_password,
  //       nb_accounts_red,
  //       nb_accounts_orange,
  //       nb_accounts_green,
  //       group_id,
  //       shared_vault_id
  //     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
  //     [
  //       row.newUserId,
  //       row.date,
  //       row.nb_accounts,
  //       row.nb_codes,
  //       row.nb_accounts_strong,
  //       row.nb_accounts_medium,
  //       row.nb_accounts_weak,
  //       row.nb_accounts_with_duplicated_password,
  //       row.nb_accounts_with_no_password,
  //       row.nb_accounts_red,
  //       row.nb_accounts_orange,
  //       row.nb_accounts_green,
  //       groupId,
  //       row.newSharedVaultId,
  //     ],
  //   );
  // }

  await db.release();
}

importFunction();
