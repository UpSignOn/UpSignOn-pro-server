import { db } from '../helpers/connection';
import { accessCodeHash } from '../helpers/accessCodeHash';
import { getSharedItems } from './getData';
import { logError } from '../helpers/logger';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const updateData = async (req: any, res: any): Promise<void> => {
  try {
    // Get params
    let userEmail = req.body?.userEmail;
    if (!userEmail || typeof userEmail !== 'string') return res.status(401).end();
    userEmail = userEmail.toLowerCase();

    const deviceId = req.body?.deviceId;
    const deviceAccessCode = req.body?.deviceAccessCode;
    const newEncryptedData = req.body?.newEncryptedData;
    const lastUpdateDate = req.body?.lastUpdateDate;
    const isNewData = req.body?.isNewData;
    const sharingPublicKey = req.body?.sharingPublicKey;
    const returningSharedItems = req.body?.returningSharedItems;
    const dataStats = req.body?.dataStats;

    // Check params
    if (!deviceId) return res.status(401).end();
    if (!deviceAccessCode) return res.status(401).end();
    if (!newEncryptedData) return res.status(401).end();
    if (!isNewData && !lastUpdateDate) return res.status(409).end(); // Behave like a CONFLICT
    if (isNewData && !sharingPublicKey) return res.status(409).end(); // Behave like a CONFLICT

    // Request DB
    const dbRes = await db.query(
      `SELECT
        user_devices.access_code_hash AS access_code_hash,
        users.encrypted_data AS encrypted_data,
        users.id AS user_id
      FROM user_devices
      INNER JOIN users ON user_devices.user_id = users.id
      WHERE users.email=$1 AND user_devices.device_unique_id = $2 AND user_devices.authorization_status='AUTHORIZED'`,
      [userEmail, deviceId],
    );

    if (!dbRes || dbRes.rowCount === 0) return res.status(404).end();

    // Check access code
    const isAccessGranted = await accessCodeHash.asyncIsOk(
      deviceAccessCode,
      dbRes.rows[0].access_code_hash,
    );
    if (!isAccessGranted) return res.status(401).end();

    // Update DB
    if (isNewData && !!dbRes.rows[0].encrypted_data) {
      // a security to increase resilience in case the app contained a bug and tried to update the user's space with empty data
      logError('updateData - Attempted to init user data where data already exists.');
      return res.status(400).end();
    }
    let updateRes;
    if (isNewData) {
      updateRes = await db.query(
        'UPDATE users SET (encrypted_data, updated_at, sharing_public_key)=($1, CURRENT_TIMESTAMP(0), $2) WHERE users.email=$3 RETURNING updated_at',
        [newEncryptedData, sharingPublicKey, userEmail],
      );
    } else {
      updateRes = await db.query(
        'UPDATE users SET (encrypted_data, updated_at)=($1, CURRENT_TIMESTAMP(0)) WHERE users.email=$2 AND users.updated_at=CAST($3 AS TIMESTAMPTZ) RETURNING updated_at',
        [newEncryptedData, userEmail, lastUpdateDate],
      );
      if (dataStats) {
        await db.query(
          'INSERT INTO data_stats (user_id, nb_accounts, nb_codes, nb_accounts_strong, nb_accounts_medium, nb_accounts_weak, nb_accounts_with_duplicate_password) VALUES ($1,$2,$3,$4,$5,$6,$7)',
          [
            dbRes.rows[0].user_id,
            dataStats.nbAccounts,
            dataStats.nbCodes,
            dataStats.nbAccountsWithStrongPassword,
            dataStats.nbAccountsWithMediumPassword,
            dataStats.nbAccountsWithWeakPassword,
            dataStats.nbAccountsWithDuplicatePasswords,
          ],
        );
      }
    }
    if (updateRes.rowCount === 0) {
      // CONFLICT
      return res.status(409).end();
    }

    if (returningSharedItems) {
      const sharedItems = await getSharedItems(dbRes.rows[0].user_id);
      return res.status(200).json({ lastUpdateDate: updateRes.rows[0].updated_at, sharedItems });
    } else {
      return res.status(200).json({ lastUpdateDate: updateRes.rows[0].updated_at });
    }
  } catch (e) {
    logError('updateData', e);
    return res.status(400).end();
  }
};
