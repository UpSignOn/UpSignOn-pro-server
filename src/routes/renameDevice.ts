import { db } from '../helpers/connection';
import { accessCodeHash } from '../helpers/accessCodeHash';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const renameDevice = async (req: any, res: any) => {
  try {
    // Get params
    let userEmail = req.body?.userEmail;
    if (!userEmail || typeof userEmail !== 'string') return res.status(401).end();
    userEmail = userEmail.toLowerCase();

    const deviceId = req.body?.deviceId;
    const deviceAccessCode = req.body?.deviceAccessCode;
    const deviceToRename = req.body?.deviceToRename;
    const newName = req.body?.newName;

    // Check params
    if (!deviceId) return res.status(401).end();
    if (!deviceAccessCode) return res.status(401).end();
    if (!deviceToRename) return res.status(401).end();
    if (!newName) return res.status(401).end();

    // Request DB
    const dbRes = await db.query(
      "SELECT users.id AS userid, user_devices.access_code_hash AS access_code_hash FROM user_devices INNER JOIN users ON user_devices.user_id = users.id WHERE users.email=$1 AND user_devices.device_unique_id = $2 AND user_devices.authorization_status='AUTHORIZED'",
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
      'UPDATE user_devices SET device_name=$1 WHERE user_id=$2 AND device_unique_id=$3',
      [newName, dbRes.rows[0].userid, deviceToRename],
    );
    // Return res
    return res.status(204).end();
  } catch (e) {
    console.error('renameDevice', e);
    return res.status(400).end();
  }
};
