import { db } from '../helpers/connection';
import { accessCodeHash } from '../helpers/accessCodeHash';
import { logError } from '../helpers/logger';
import { isStrictlyLowerVersion } from '../helpers/appVersionChecker';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const updateSharedItem = async (req: any, res: any): Promise<void> => {
  try {
    // Get params
    const appVersion = req.body?.appVersion;
    if (isStrictlyLowerVersion(appVersion, '4.5.0')) {
      return res.status(403).send({ error: 'deprecated_app' });
    }

    let userEmail = req.body?.userEmail;
    if (!userEmail || typeof userEmail !== 'string') return res.status(401).end();
    userEmail = userEmail.toLowerCase();

    const deviceId = req.body?.deviceId;
    const deviceAccessCode = req.body?.deviceAccessCode;
    const sharedItem = req.body?.sharedItem;
    const contactPasswords = req.body?.contactPasswords;
    const aesKeyUpdates = req.body?.aesKeyUpdates;

    // Check params
    if (!deviceId) return res.status(401).end();
    if (!deviceAccessCode) return res.status(401).end();
    if (!sharedItem) return res.status(401).end();

    // Request DB
    const dbRes = await db.query(
      `SELECT
        ud.access_code_hash AS access_code_hash
      FROM user_devices AS ud
      INNER JOIN users AS u ON ud.user_id = u.id
      INNER JOIN shared_account_users AS sau ON u.id = sau.user_id
      WHERE
        u.email=$1
        AND ud.device_unique_id = $2
        AND sau.shared_account_id = $3
        AND sau.is_manager = true
        AND ud.authorization_status = 'AUTHORIZED'`,
      [userEmail, deviceId, sharedItem.id],
    );

    if (!dbRes || dbRes.rowCount === 0) return res.status(401).end();

    // Check access code
    const isAccessGranted = await accessCodeHash.asyncIsOk(
      deviceAccessCode,
      dbRes.rows[0].access_code_hash,
    );
    if (!isAccessGranted) return res.status(401).end();

    await db.query(
      'UPDATE shared_accounts SET (url, name, login, aes_encrypted_data)=($1, $2, $3, $4) WHERE id=$5',
      [
        sharedItem.url,
        sharedItem.name,
        sharedItem.login,
        sharedItem.aesEncryptedData,
        sharedItem.id,
      ],
    );

    if (contactPasswords && Array.isArray(contactPasswords)) {
      for (let i = 0; i < contactPasswords.length; i++) {
        // Security: do not use foreach or map
        const userId = contactPasswords[i].id;
        const encPwd = contactPasswords[i].encryptedPassword;
        await db.query(
          'UPDATE shared_account_users SET encrypted_password=$1  WHERE shared_account_id = $2 AND user_id = $3',
          [encPwd, sharedItem.id, userId],
        );
      }
    }

    if (aesKeyUpdates && Array.isArray(aesKeyUpdates)) {
      for (let i = 0; i < aesKeyUpdates.length; i++) {
        // Security: do not use foreach or map
        const userId = aesKeyUpdates[i].id;
        const encKey = aesKeyUpdates[i].encryptedAesKey;
        await db.query(
          'UPDATE shared_account_users SET encrypted_aes_key=$1  WHERE shared_account_id = $2 AND user_id = $3',
          [encKey, sharedItem.id, userId],
        );
      }
    }

    return res.status(200).end();
  } catch (e) {
    logError('updateSharedItem', e);
    return res.status(400).end();
  }
};
