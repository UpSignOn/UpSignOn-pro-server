import { db } from '../helpers/connection';
import { logError } from '../helpers/logger';
import { accessCodeHash } from '../helpers/accessCodeHash';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const migrateToCryptographicAuthentication = async (req: any, res: any) => {
  // This function must only be called after the data has been updated with the password challenge
  try {
    let userEmail = req.body?.userEmail;
    const deviceId = req.body?.deviceId;
    const deviceAccessCode = req.body?.deviceAccessCode;
    const devicePublicKey = req.body?.devicePublicKey;
    const groupId = parseInt(req.params.groupId || 1);

    if (
      !userEmail ||
      typeof userEmail !== 'string' ||
      !deviceId ||
      !deviceAccessCode ||
      !devicePublicKey
    ) {
      return res.status(401).end();
    }
    userEmail = userEmail.toLowerCase();
    const dbRes = await db.query(
      `SELECT
        u.id AS user_id,
        ud.access_code_hash AS access_code_hash
      FROM user_devices AS ud
      INNER JOIN users AS u ON ud.user_id = u.id
      WHERE
        u.email=$1
        AND ud.device_unique_id = $2
        AND ud.authorization_status='AUTHORIZED'
        AND u.group_id=$3
      `,
      [userEmail, deviceId, groupId],
    );

    if (!dbRes || dbRes.rowCount === 0) return res.status(401).end();

    // Check access code
    const isAccessGranted = await accessCodeHash.asyncIsOk(
      deviceAccessCode,
      dbRes.rows[0].access_code_hash,
    );
    if (!isAccessGranted) return res.status(401).end();

    // USER HAS BEEN AUTHENTICATED WITH THE OLD MECANISM

    await db.query(
      'UPDATE user_devices SET device_public_key=$1, access_code_hash=NULL WHERE user_id=$2 AND device_unique_id=$3 AND group_id=$4',
      [devicePublicKey, dbRes.rows[0].user_id, deviceId, groupId],
    );
    // Return res
    return res.status(204).end();
  } catch (e) {
    logError('migrateToCryptographicAuthentication', e);
    return res.status(400).end();
  }
};
