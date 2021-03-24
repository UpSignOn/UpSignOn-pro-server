import { db } from '../helpers/connection';
import { accessCodeHash } from '../helpers/accessCodeHash';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const share = async (req: any, res: any): Promise<void> => {
  try {
    // Get params
    const userEmail = req.body?.userEmail;
    const deviceId = req.body?.deviceId;
    const deviceAccessCode = req.body?.deviceAccessCode;
    const sharings: {
      type: string;
      url: null | string;
      name: null | string;
      login: null | string;
      dbId: null | number;
      idInUserEnv: null | number;
      contacts: { email: string; isManager: boolean; encryptedPassword: string }[];
    }[] = req.body?.sharings;

    // Check params
    if (!userEmail) return res.status(401).end();
    if (!deviceId) return res.status(401).end();
    if (!deviceAccessCode) return res.status(401).end();
    if (!sharings || !Array.isArray(sharings)) return res.status(401).end();

    // Request DB
    const dbRes = await db.query(
      'SELECT users.id AS user_id, user_devices.authorization_status AS authorization_status, user_devices.access_code_hash AS access_code_hash, users.encrypted_data AS encrypted_data FROM user_devices INNER JOIN users ON user_devices.user_id = users.id WHERE users.email=$1 AND user_devices.device_unique_id = $2',
      [userEmail, deviceId],
    );

    if (!dbRes || dbRes.rowCount === 0) return res.status(404).end();
    if (dbRes.rows[0].authorization_status !== 'AUTHORIZED') return res.status(401).end();
    const currentUserId = dbRes.rows[0].user_id;

    // Check access code
    const isAccessGranted = await accessCodeHash.asyncIsOk(
      deviceAccessCode,
      dbRes.rows[0].access_code_hash,
    );
    if (!isAccessGranted) return res.status(401).end();

    const errors = [];
    const newSharedItemIdsMap: any = {};
    for (let i = 0; i < sharings.length; i++) {
      // Security: do not use foreach or map
      const sharing = sharings[i];
      // check at least current user is in contact list
      // and force current user to be manager
      const cleanContacts = [];
      let isCurrentUserInList = false;
      for (let c = 0; c < sharing.contacts.length; c++) {
        const contact = sharing.contacts[c];
        if (contact.email === userEmail) {
          isCurrentUserInList = true;
          cleanContacts.push({
            email: contact.email,
            isManager: true,
            encryptedPassword: contact.encryptedPassword,
          });
        } else {
          cleanContacts.push({
            email: contact.email,
            isManager: contact.isManager,
            encryptedPassword: contact.encryptedPassword,
          });
        }
      }
      if (!sharing.dbId && !isCurrentUserInList) {
        errors.push({ name: sharing.name, error: 'self_not_in_list' });
        continue;
      }

      // Insert sharedAccount or check rights
      let sharingId;
      if (sharing.dbId) {
        const isManagerCheck = await db.query(
          'SELECT is_manager FROM shared_account_users WHERE user_id=$1 AND shared_account_id=$2',
          [currentUserId, sharing.dbId],
        );
        if (isManagerCheck.rowCount === 0 || !isManagerCheck.rows[0].is_manager) {
          return res.status(401).end();
        }
        sharingId = sharing.dbId;
      } else {
        const newSharedAccount = await db.query(
          'INSERT INTO shared_accounts (url, name, type, login) VALUES ($1, $2, $3, $4) RETURNING id',
          [sharing.url, sharing.name, sharing.type, sharing.login],
        );
        sharingId = newSharedAccount.rows[0].id;
        if (!sharing.idInUserEnv) {
          errors.push({ name: sharing.name, error: 'no_id_provided' });
        } else {
          newSharedItemIdsMap[sharing.idInUserEnv] = sharingId;
        }
      }

      // Insert sharedAccountUsers
      for (let cc = 0; cc < cleanContacts.length; cc++) {
        try {
          await db.query(
            'INSERT INTO shared_account_users (shared_account_id, user_id, is_manager, encrypted_password) SELECT $1 AS shared_account_id, id AS user_id, $2 AS is_manager, $3 AS encrypted_password FROM users WHERE email=$4',
            [
              sharingId,
              cleanContacts[cc].isManager,
              cleanContacts[cc].encryptedPassword,
              cleanContacts[cc].email,
            ],
          );
        } catch {
          errors.push({
            name: sharing.name,
            contact: cleanContacts[cc].email,
            error: 'contact_conflict',
          });
          // probably a conflict, do nothing
        }
      }
    }

    res.status(200).json({ errors, newSharedItemIdsMap });
  } catch (e) {
    console.error(e);
    return res.status(400).end();
  }
};
