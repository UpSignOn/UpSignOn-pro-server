import { db } from '../helpers/connection';
import { accessCodeHash } from '../helpers/accessCodeHash';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const backupPassword = async (req: any, res: any) => {
  try {
    // Get params
    const userEmail = req.body?.userEmail;
    const deviceId = req.body?.deviceId;
    const deviceAccessCode = req.body?.deviceAccessCode;
    const backups = req.body?.backups;

    // Check params
    if (!userEmail) return res.status(401).end();
    if (!deviceId) return res.status(401).end();
    if (!deviceAccessCode) return res.status(401).end();
    if (!backups || !Array.isArray(backups)) return res.status(401).end();

    // Request DB
    const dbRes = await db.query(
      'SELECT users.id AS userid, user_devices.authorization_status AS authorization_status, user_devices.access_code_hash AS access_code_hash FROM user_devices INNER JOIN users ON user_devices.user_id = users.id WHERE users.email=$1 AND user_devices.device_unique_id = $2',
      [userEmail, deviceId],
    );

    if (!dbRes || dbRes.rowCount === 0) return res.status(401).end();
    if (dbRes.rows[0].authorization_status !== 'AUTHORIZED') return res.status(401).end();

    // Check access code
    const isAccessGranted = await accessCodeHash.asyncIsOk(
      deviceAccessCode,
      dbRes.rows[0].access_code_hash,
    );
    if (!isAccessGranted) return res.status(401).end();

    await Promise.all(
      backups.map((backup) =>
        db.query(
          "UPDATE user_devices SET encrypted_password_backup=$1 WHERE device_unique_id=$2 AND user_id=$3 AND authorization_status='AUTHORIZED'",
          [backup.encryptedPassword, backup.deviceId, dbRes.rows[0].userid],
        ),
      ),
    );
    // Return res
    return res.status(204).end();
  } catch (e) {
    console.error(e);
    return res.status(400).end();
  }
};
