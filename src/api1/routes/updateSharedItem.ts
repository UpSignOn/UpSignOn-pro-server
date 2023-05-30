import { db } from '../../helpers/db';
import { logError } from '../../helpers/logger';
import { isStrictlyLowerVersion } from '../../helpers/appVersionChecker';
import { checkBasicAuth } from '../helpers/authorizationChecks';
import { inputSanitizer } from '../../helpers/sanitizer';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const updateSharedItem = async (req: any, res: any): Promise<void> => {
  try {
    const appVersion = inputSanitizer.getString(req.body?.appVersion);
    if (isStrictlyLowerVersion(appVersion, '4.5.0')) {
      return res.status(403).send({ error: 'deprecated_app' });
    }

    const sharedItem = inputSanitizer.getSharedItem(req.body?.sharedItem);
    const aesKeyUpdates = inputSanitizer.getAesKeyUpdates(req.body?.aesKeyUpdates);
    if (!sharedItem) return res.status(401).end();

    const basicAuth = await checkBasicAuth(req, { checkIsManagerForItemId: sharedItem.id });
    if (!basicAuth.granted) return res.status(401).end();

    await db.query(
      'UPDATE shared_accounts SET (url, name, login, aes_encrypted_data)=($1, $2, $3, $4) WHERE id=$5 AND group_id=$6',
      [
        sharedItem.url,
        sharedItem.name,
        sharedItem.login,
        sharedItem.aesEncryptedData,
        sharedItem.id,
        basicAuth.groupId,
      ],
    );

    if (aesKeyUpdates && Array.isArray(aesKeyUpdates)) {
      for (let i = 0; i < aesKeyUpdates.length; i++) {
        // Security: do not use foreach or map
        const userId = aesKeyUpdates[i].id;
        const encKey = aesKeyUpdates[i].encryptedAesKey;
        await db.query(
          'UPDATE shared_account_users SET encrypted_aes_key=$1  WHERE shared_account_id = $2 AND user_id = $3 AND group_id=$4',
          [encKey, sharedItem.id, userId, basicAuth.groupId],
        );
      }
    }

    return res.status(200).end();
  } catch (e) {
    logError('updateSharedItem', e);
    return res.status(400).end();
  }
};
