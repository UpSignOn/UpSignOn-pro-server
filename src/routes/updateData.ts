import { db } from '../helpers/connection';
import { getSharedItems } from './getData';
import { logError } from '../helpers/logger';
import { checkBasicAuth } from '../helpers/authorizationChecks';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const updateData = async (req: any, res: any): Promise<void> => {
  try {
    const newEncryptedData = req.body?.newEncryptedData;
    const lastUpdateDate = req.body?.lastUpdateDate;
    const isNewData = req.body?.isNewData;
    const sharingPublicKey = req.body?.sharingPublicKey;
    const returningSharedItems = req.body?.returningSharedItems;

    // Check params
    if (!newEncryptedData) return res.status(401).end();
    if (!isNewData && !lastUpdateDate) return res.status(409).end(); // Behave like a CONFLICT
    if (isNewData && !sharingPublicKey) return res.status(409).end(); // Behave like a CONFLICT

    const basicAuth = await checkBasicAuth(req, { returningData: true });
    if (!basicAuth.granted) return res.status(401).end();

    // Update DB
    if (isNewData && !!basicAuth.encryptedData) {
      // a security to increase resilience in case the app contained a bug and tried to update the user's space with empty data
      logError('updateData - Attempted to init user data where data already exists.');
      return res.status(400).end();
    }
    let updateRes;
    if (isNewData) {
      updateRes = await db.query(
        'UPDATE users SET (encrypted_data, updated_at, sharing_public_key)=($1, CURRENT_TIMESTAMP(0), $2) WHERE users.email=$3 RETURNING updated_at',
        [newEncryptedData, sharingPublicKey, basicAuth.userEmail],
      );
    } else {
      updateRes = await db.query(
        'UPDATE users SET (encrypted_data, updated_at)=($1, CURRENT_TIMESTAMP(0)) WHERE users.email=$2 AND users.updated_at=CAST($3 AS TIMESTAMPTZ) RETURNING updated_at',
        [newEncryptedData, basicAuth.userEmail, lastUpdateDate],
      );
    }
    if (updateRes.rowCount === 0) {
      // CONFLICT
      return res.status(409).end();
    }

    if (returningSharedItems) {
      const sharedItems = await getSharedItems(basicAuth.userId);
      return res.status(200).json({ lastUpdateDate: updateRes.rows[0].updated_at, sharedItems });
    } else {
      return res.status(200).json({ lastUpdateDate: updateRes.rows[0].updated_at });
    }
  } catch (e) {
    logError('updateData', e);
    return res.status(400).end();
  }
};
