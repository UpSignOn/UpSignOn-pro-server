import { db } from '../helpers/connection';
import { accessCodeHash } from '../helpers/accessCodeHash';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const checkEmailAddressForSharing = async (req: any, res: any) => {
  try {
    // Get params
    let userEmail = req.body?.userEmail;
    if (!userEmail || typeof userEmail !== 'string') return res.status(401).end();
    userEmail = userEmail.toLowerCase();

    const deviceId = req.body?.deviceId;
    const deviceAccessCode = req.body?.deviceAccessCode;
    const emailAddress = req.body?.emailAddress;

    // Check params
    if (!deviceId) return res.status(401).end();
    if (!deviceAccessCode) return res.status(401).end();
    if (!emailAddress) return res.status(401).end();

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

    const checkRes = await db.query(
      'SELECT sharing_public_key FROM users WHERE email=$1 AND sharing_public_key IS NOT NULL',
      [emailAddress],
    );
    // Return res
    return res
      .status(200)
      .json({ valid: checkRes.rowCount > 0, publicKey: checkRes.rows[0]?.sharing_public_key });
  } catch (e) {
    console.error('checkEmailAddressForSharing', e);
    return res.status(400).end();
  }
};
