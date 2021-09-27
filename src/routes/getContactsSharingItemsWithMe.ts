import { db } from '../helpers/connection';
import { accessCodeHash } from '../helpers/accessCodeHash';
import { logError } from '../helpers/logger';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const getContactsSharingItemsWithMe = async (req: any, res: any) => {
  try {
    // Get params
    let userEmail = req.body?.userEmail;
    if (!userEmail || typeof userEmail !== 'string') return res.status(401).end();
    userEmail = userEmail.toLowerCase();

    const deviceId = req.body?.deviceId;
    const deviceAccessCode = req.body?.deviceAccessCode;

    // Check params
    if (!deviceId) return res.status(401).end();
    if (!deviceAccessCode) return res.status(401).end();

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

    const contactsSharingItemsWithUser = await db.query(
      'SELECT DISTINCT u.email AS email, u.sharing_public_key AS sharing_public_key ' +
        'FROM users AS u INNER JOIN shared_account_users AS sau ON u.id=sau.user_id ' +
        'INNER JOIN shared_account_users AS sau2 ON sau.shared_account_id=sau2.shared_account_id ' +
        'INNER JOIN users AS u2 ON sau2.user_id = u2.id AND u2.email=$1 WHERE u.email != $1',
      [userEmail],
    );
    // Return res
    return res.status(200).json({
      contacts: contactsSharingItemsWithUser.rows.map((d) => {
        return {
          email: d.email,
          publicKey: d.sharing_public_key,
        };
      }),
    });
  } catch (e) {
    logError('getContactsSharingItemsWithMe', e);
    return res.status(400).end();
  }
};
