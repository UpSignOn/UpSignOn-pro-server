import { db } from '../helpers/connection';
import { accessCodeHash } from '../helpers/accessCodeHash';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const getAuthorizedDevices = async (req: any, res: any) => {
  try {
    // Get params
    const userEmail = req.body?.userEmail;
    const deviceId = req.body?.deviceId;
    const deviceAccessCode = req.body?.deviceAccessCode;

    // Check params
    if (!userEmail) return res.status(401).end();
    if (!deviceId) return res.status(401).end();
    if (!deviceAccessCode) return res.status(401).end();

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

    const devicesRes = await db.query(
      "SELECT device_name, device_unique_id FROM user_devices WHERE authorization_status='AUTHORIZED' AND user_id=$1",
      [dbRes.rows[0].userid],
    );
    // Return res
    return res.status(200).json({ devices: devicesRes.rows });
  } catch (e) {
    console.error(e);
    return res.status(400).end();
  }
};
