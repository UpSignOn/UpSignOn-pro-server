import { db } from '../helpers/connection';
import { accessCodeHash } from '../helpers/accessCodeHash';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const getContactsPublicKeys = async (req: any, res: any) => {
  try {
    // Get params
    const userEmail = req.body?.userEmail;
    const deviceId = req.body?.deviceId;
    const deviceAccessCode = req.body?.deviceAccessCode;
    const itemId = req.body?.itemId;

    // Check params
    if (!userEmail) return res.status(401).end();
    if (!deviceId) return res.status(401).end();
    if (!deviceAccessCode) return res.status(401).end();
    if (!itemId) return res.status(401).end();

    // Request DB
    const dbRes = await db.query(
      `SELECT
        user_devices.access_code_hash AS access_code_hash
      FROM user_devices
      INNER JOIN users ON user_devices.user_id = users.id
      WHERE users.email=$1 AND user_devices.device_unique_id = $2 AND authorization_status = 'AUTHORIZED'`,
      [userEmail, deviceId],
    );

    if (!dbRes || dbRes.rowCount === 0) return res.status(401).end();

    // Check access code
    const isAccessGranted = await accessCodeHash.asyncIsOk(
      deviceAccessCode,
      dbRes.rows[0].access_code_hash,
    );
    if (!isAccessGranted) return res.status(401).end();

    const contactRes = await db.query(
      'SELECT users.id, users.sharing_public_key FROM users INNER JOIN shared_account_users AS sau ON sau.user_id=users.id WHERE sau.shared_account_id = $1',
      [itemId],
    );
    // Return res
    return res.status(200).json({ contactsPublicKeys: contactRes.rows });
  } catch (e) {
    console.error(e);
    return res.status(400).end();
  }
};
