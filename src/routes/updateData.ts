import { db } from '../helpers/connection';
import { accessCodeHash } from '../helpers/accessCodeHash';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const updateData = async (req: any, res: any): Promise<void> => {
  try {
    // Get params
    const userEmail = req.body?.userEmail;
    const deviceId = req.body?.deviceId;
    const deviceAccessCode = req.body?.deviceAccessCode;
    const newEncryptedData = req.body?.newEncryptedData;
    const lastUpdateDate = req.body?.lastUpdateDate;
    const isNewData = req.body?.isNewData;

    // Check params
    if (!userEmail) return res.status(401).end();
    if (!deviceId) return res.status(401).end();
    if (!deviceAccessCode) return res.status(401).end();
    if (!newEncryptedData) return res.status(401).end();
    if (!isNewData && !lastUpdateDate) return res.status(409).end(); // Behave like a CONFLICT

    // Request DB
    const dbRes = await db.query(
      'SELECT user_devices.authorization_status AS authorization_status, user_devices.access_code_hash AS access_code_hash, users.encrypted_data AS encrypted_data FROM user_devices INNER JOIN users ON user_devices.user_id = users.id WHERE users.email=$1 AND user_devices.device_unique_id = $2',
      [userEmail, deviceId],
    );

    if (!dbRes || dbRes.rowCount === 0) return res.status(404).end();
    if (dbRes.rows[0].authorization_status !== 'AUTHORIZED') return res.status(401).end();

    // Check access code
    const isAccessGranted = await accessCodeHash.asyncIsOk(
      deviceAccessCode,
      dbRes.rows[0].access_code_hash,
    );
    if (!isAccessGranted) return res.status(401).end();

    // Update DB
    if (isNewData && !!dbRes.rows[0].encrypted_data) {
      // a security to increase resilience in case the app contained a bug and tried to update the user's space with empty data
      console.error('Attempted to init user data where data already exists.');
      return res.status(400).end();
    }
    let updateRes;
    if (isNewData) {
      updateRes = await db.query(
        'UPDATE users SET (encrypted_data, updated_at)=($1, CURRENT_TIMESTAMP(0)) WHERE users.email=$2 RETURNING updated_at',
        [newEncryptedData, userEmail],
      );
    } else {
      updateRes = await db.query(
        'UPDATE users SET (encrypted_data, updated_at)=($1, CURRENT_TIMESTAMP(0)) WHERE users.email=$2 AND users.updated_at=CAST($3 AS TIMESTAMPTZ) RETURNING updated_at',
        [newEncryptedData, userEmail, lastUpdateDate],
      );
    }
    if (updateRes.rowCount === 0) {
      // CONFLICT
      return res.status(409).end();
    }
    return res.status(200).json({ lastUpdateDate: updateRes.rows[0].updated_at });
  } catch (e) {
    console.error(e);
    return res.status(400).end();
  }
};
