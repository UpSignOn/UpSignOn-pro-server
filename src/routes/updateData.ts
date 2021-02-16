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

    // Check params
    if (!userEmail) return res.status(401).end();
    if (!deviceId) return res.status(401).end();
    if (!deviceAccessCode) return res.status(401).end();
    if (!newEncryptedData) return res.status(401).end();

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
    await db.query('UPDATE users SET encrypted_data=$1 WHERE users.email=$2', [
      newEncryptedData,
      userEmail,
    ]);
    // Return res
    return res.status(200).json({ encryptedData: dbRes.rows[0].encrypted_data });
  } catch (e) {
    console.error(e);
    return res.status(400).end();
  }
};
