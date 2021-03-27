import { db } from '../helpers/connection';
import { accessCodeHash } from '../helpers/accessCodeHash';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const updateDeviceMetaData = async (req: any, res: any): Promise<void> => {
  try {
    // Get params
    const userEmail = req.body?.userEmail;
    const deviceId = req.body?.deviceId;
    const deviceAccessCode = req.body?.deviceAccessCode;
    const deviceName = req.body?.deviceName;
    const osVersion = req.body?.osVersion;
    const appVersion = req.body?.appVersion;

    // Check params
    if (!userEmail) return res.status(401).end();
    if (!deviceId) return res.status(401).end();
    if (!deviceAccessCode) return res.status(401).end();

    // Request DB
    const dbRes = await db.query(
      `SELECT
        ud.id AS id,
        ud.access_code_hash AS access_code_hash
      FROM user_devices AS ud
      INNER JOIN users AS u ON ud.user_id = u.id
      WHERE
        u.email=$1
        AND ud.device_unique_id = $2
        AND ud.authorization_status = 'AUTHORIZED'`,
      [userEmail, deviceId],
    );

    if (!dbRes || dbRes.rowCount === 0) return res.status(401).end();

    // Check access code
    const isAccessGranted = await accessCodeHash.asyncIsOk(
      deviceAccessCode,
      dbRes.rows[0].access_code_hash,
    );
    if (!isAccessGranted) return res.status(401).end();

    await db.query(
      'UPDATE user_devices SET device_name=$1, os_version=$2, app_version=$3 WHERE id=$4',
      [deviceName, osVersion, appVersion, dbRes.rows[0].id],
    );

    return res.status(200).end();
  } catch (e) {
    console.error(e);
    return res.status(400).end();
  }
};
