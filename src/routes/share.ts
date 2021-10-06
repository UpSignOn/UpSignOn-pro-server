import { db } from '../helpers/connection';
import { logError } from '../helpers/logger';
import { isStrictlyLowerVersion } from '../helpers/appVersionChecker';
import { checkBasicAuth } from '../helpers/authorizationChecks';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const share = async (req: any, res: any): Promise<void> => {
  try {
    const appVersion = req.body?.appVersion;
    if (isStrictlyLowerVersion(appVersion, '4.5.0')) {
      return res.status(403).send({ error: 'deprecated_app' });
    }

    const sharings: {
      type: string;
      url: null | string;
      name: null | string;
      login: null | string;
      dbId: null | number;
      idInUserEnv: null | number;
      contacts: {
        email: string;
        isManager: boolean;
        encryptedPassword: string;
        encryptedAesKey: string;
      }[];
      aesEncryptedData: string;
    }[] = req.body?.sharings;

    if (!sharings || !Array.isArray(sharings)) return res.status(401).end();

    const basicAuth = await checkBasicAuth(req);
    if (!basicAuth.granted) return res.status(401).end();

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
        if (typeof contact.email === 'string') {
          contact.email = contact.email.toLowerCase();
        }
        if (contact.email === basicAuth.userEmail) {
          isCurrentUserInList = true;
          cleanContacts.push({
            email: contact.email,
            isManager: true,
            encryptedPassword: contact.encryptedPassword,
            encryptedAesKey: contact.encryptedAesKey,
          });
        } else {
          cleanContacts.push({
            email: contact.email,
            isManager: contact.isManager,
            encryptedPassword: contact.encryptedPassword,
            encryptedAesKey: contact.encryptedAesKey,
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
          [basicAuth.userId, sharing.dbId],
        );
        if (isManagerCheck.rowCount === 0 || !isManagerCheck.rows[0].is_manager) {
          return res.status(401).end();
        }
        sharingId = sharing.dbId;
      } else {
        const newSharedAccount = await db.query(
          'INSERT INTO shared_accounts (url, name, type, login, aes_encrypted_data) VALUES ($1, $2, $3, $4, $5) RETURNING id',
          [sharing.url, sharing.name, sharing.type, sharing.login, sharing.aesEncryptedData],
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
            'INSERT INTO shared_account_users (shared_account_id, user_id, is_manager, encrypted_password, encrypted_aes_key) SELECT $1 AS shared_account_id, id AS user_id, $2 AS is_manager, $3 AS encrypted_password, $4 AS encrypted_aes_key FROM users WHERE email=$5',
            [
              sharingId,
              cleanContacts[cc].isManager,
              cleanContacts[cc].encryptedPassword,
              cleanContacts[cc].encryptedAesKey,
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
    logError('share', e);
    return res.status(400).end();
  }
};
