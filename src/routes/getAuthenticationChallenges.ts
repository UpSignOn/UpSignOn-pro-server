import { db } from '../helpers/db';
import { logError } from '../helpers/logger';
import { createDeviceChallenge } from '../helpers/deviceChallenge';
import { getPasswordChallenge } from '../helpers/passwordChallenge';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const getAuthenticationChallenges = async (req: any, res: any) => {
  try {
    const deviceId = req.body?.deviceId;
    let userEmail = req.body?.userEmail;
    const groupId = parseInt(req.params.groupId || 1);

    if (!userEmail || typeof userEmail !== 'string' || !deviceId) {
      return res.status(401).end();
    }
    userEmail = userEmail.toLowerCase();

    const dbRes = await db.query(
      `SELECT
        u.encrypted_data AS encrypted_data,
        char_length(ud.access_code_hash) > 0 AS has_access_code_hash,
        char_length(ud.device_public_key) > 0 AS has_device_public_key,
        ud.id AS did
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
    if (dbRes.rows[0].has_access_code_hash || !dbRes.rows[0].has_device_public_key)
      return res.status(401).end();

    const passwordChallenge = getPasswordChallenge(dbRes.rows[0].encrypted_data);
    const deviceChallenge = await createDeviceChallenge(dbRes.rows[0].did);

    return res.status(200).json({
      passwordChallenge: passwordChallenge.pwdChallengeBase64,
      keySalt: passwordChallenge.keySaltBase64,
      deviceChallenge,
    });
  } catch (e) {
    logError('getAuthenticationChallenges', e);
    return res.status(400).end();
  }
};
