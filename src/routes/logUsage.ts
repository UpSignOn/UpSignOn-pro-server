import { accessCodeHash } from '../helpers/accessCodeHash';
import { db } from '../helpers/connection';
import { logError } from '../helpers/logger';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const logUsage = async (req: any, res: any): Promise<void> => {
  try {
    // Get params
    let userEmail = req.body?.userEmail;
    if (!userEmail || typeof userEmail !== 'string') return res.status(401).end();
    userEmail = userEmail.toLowerCase();

    const deviceId = req.body?.deviceId;
    const deviceAccessCode = req.body?.deviceAccessCode;
    const logType = req.body?.logType;

    // Check params
    if (!deviceAccessCode) return res.status(401).end();
    if (!logType) return res.status(401).end();

    // Request DB
    const dbRes = await db.query(
      `SELECT
        user_devices.access_code_hash AS access_code_hash,
        user_devices.id AS id
      FROM user_devices
      INNER JOIN users ON user_devices.user_id = users.id
      WHERE users.email=$1 AND user_devices.device_unique_id = $2 AND user_devices.authorization_status='AUTHORIZED'`,
      [userEmail, deviceId],
    );

    if (!dbRes || dbRes.rowCount === 0) return res.status(401).end();

    // Check access code
    const isAccessGranted = await accessCodeHash.asyncIsOk(
      deviceAccessCode,
      dbRes.rows[0].access_code_hash,
    );
    if (!isAccessGranted) return res.status(401).end();

    // db request
    await db.query('INSERT INTO usage_logs (device_id, log_type) VALUES ($1,$2)', [
      dbRes.rows[0].id,
      logType,
    ]);

    return res.status(204).end();
  } catch (e) {
    logError('logUsage', e);
    return res.status(400).end();
  }
};
