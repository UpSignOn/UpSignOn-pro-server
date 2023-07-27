import { db } from '../../helpers/db';
import { logError } from '../../helpers/logger';
import { isStrictlyLowerVersion } from '../../helpers/appVersionChecker';
import { checkBasicAuth } from '../../helpers/authorizationChecks';
import { inputSanitizer } from '../../helpers/sanitizer';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const share = async (req: any, res: any): Promise<void> => {
  try {
    const appVersion = inputSanitizer.getString(req.body?.appVersion);
    if (isStrictlyLowerVersion(appVersion, '4.5.0')) {
      return res.status(403).send({ error: 'deprecated_app' });
    }

    const sharings:
      | null
      | {
        type: string;
        url: null | string;
        name: null | string;
        login: null | string;
        dbId: null | number;
        idInUserEnv: null | number;
        contacts: {
          email: string;
          isManager: boolean;
          encryptedAesKey: string;
        }[];
        aesEncryptedData: null | string;
      }[] = inputSanitizer.getSharings(req.body?.sharings);

    if (!sharings) return res.status(401).end();

    const basicAuth = await checkBasicAuth(req);
    if (!basicAuth.granted) return res.status(401).end();

    const errors = [];
    const newSharedItemIdsMap: any = {};
    for (let i = 0; i < sharings.length; i++) {
      // Security: do not use foreach or map
      const sharing = sharings[i];

      if (!sharing.dbId && !sharing.aesEncryptedData) {
        errors.push({ name: sharing.name, error: 'no_data_for_new_sharing' });
        continue;
      }

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
            encryptedAesKey: contact.encryptedAesKey,
          });
        } else {
          cleanContacts.push({
            email: contact.email,
            isManager: contact.isManager,
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
          'SELECT is_manager FROM shared_account_users WHERE user_id=$1 AND shared_account_id=$2 AND group_id=$3',
          [basicAuth.userId, sharing.dbId, basicAuth.groupId],
        );
        if (isManagerCheck.rowCount === 0 || !isManagerCheck.rows[0].is_manager) {
          return res.status(401).end();
        }
        sharingId = sharing.dbId;
      } else {
        const newSharedAccount = await db.query(
          'INSERT INTO shared_accounts (url, name, type, login, aes_encrypted_data, group_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
          [
            sharing.url,
            sharing.name,
            sharing.type,
            sharing.login,
            sharing.aesEncryptedData,
            basicAuth.groupId,
          ],
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
            'INSERT INTO shared_account_users (shared_account_id, user_id, is_manager, encrypted_aes_key, group_id) SELECT $1 AS shared_account_id, id AS user_id, $2 AS is_manager, $3 AS encrypted_aes_key, $5 AS group_id FROM users WHERE email=$4 AND group_id=$5',
            [
              sharingId,
              cleanContacts[cc].isManager,
              cleanContacts[cc].encryptedAesKey,
              cleanContacts[cc].email,
              basicAuth.groupId,
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
