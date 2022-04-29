import { db } from '../helpers/db';
import { logError } from '../helpers/logger';
import { checkDeviceRequestAuthorization, createDeviceChallenge } from '../helpers/deviceChallenge';
import { checkBasicAuth } from '../helpers/authorizationChecks';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const removeAuthorization = async (req: any, res: any) => {
  try {
    const deviceId = req.body?.deviceId;
    const deviceToDelete = req.body?.deviceToDelete || deviceId;

    const groupId = parseInt(req.params.groupId || 1);
    let userId = null;

    // DEVICE CAN REVOKE ITSELF WITHOUT FULL SESSION
    if (deviceId === deviceToDelete) {
      // Get params
      let userEmail = req.body?.userEmail;
      if (!userEmail || typeof userEmail !== 'string') return res.status(401).end();
      userEmail = userEmail.toLowerCase();

      const deviceAccessCode = req.body?.deviceAccessCode;
      const deviceChallengeResponse = req.body?.deviceChallengeResponse;

      // Check params
      if (!userEmail) return res.status(401).end();
      if (!deviceId) return res.status(401).end();

      // Request DB
      const dbRes = await db.query(
        'SELECT ' +
          'ud.id AS id, ' +
          'users.id AS uid, ' +
          'ud.access_code_hash AS access_code_hash, ' +
          'ud.device_public_key > 0 AS device_public_key, ' +
          'ud.session_auth_challenge AS session_auth_challenge, ' +
          'ud.session_auth_challenge_exp_time AS session_auth_challenge_exp_time ' +
          'FROM user_devices AS ud ' +
          'INNER JOIN users ON ud.user_id = users.id ' +
          'WHERE ' +
          'users.email=$1 ' +
          'AND ud.device_unique_id = $2 ' +
          "AND ud.authorization_status = 'AUTHORIZED' " +
          'AND users.group_id=$4',
        [userEmail, deviceId, groupId],
      );

      if (!dbRes || dbRes.rowCount === 0) {
        return res.status(401).end();
      }

      // you can revoke a device by having an authenticated session or by providing device authentication
      if (
        !req.session ||
        req.session.userEmail != req.body?.userEmail ||
        req.session.deviceUniqueId != req.body?.deviceId ||
        req.session.groupId != groupId
      ) {
        if (!deviceChallengeResponse) {
          const deviceChallenge = await createDeviceChallenge(dbRes.rows[0].id);
          return res.status(403).json({ deviceChallenge });
        }
        const isDeviceAuthorized = await checkDeviceRequestAuthorization(
          deviceAccessCode,
          dbRes.rows[0].access_code_hash,
          deviceChallengeResponse,
          dbRes.rows[0].id,
          dbRes.rows[0].session_auth_challenge_exp_time,
          dbRes.rows[0].session_auth_challenge,
          dbRes.rows[0].device_public_key,
        );
        if (!isDeviceAuthorized) return res.status(401).end();
      }

      userId = dbRes.rows[0].uid;
    } else {
      // DEVICE CAN ONLY REVOKE OTHER DEVICES WITH FULL SESSION
      const basicAuth = await checkBasicAuth(req);
      if (!basicAuth.granted) return res.status(401).end();
      userId = basicAuth.userId;
    }

    await db.query(
      "UPDATE user_devices SET device_unique_id=null, authorization_status='REVOKED_BY_USER', access_code_hash='', device_public_key=null, encrypted_password_backup='', revocation_date=$1 WHERE device_unique_id=$2 AND user_id=$3 AND group_id=$4",
      [new Date().toISOString(), deviceToDelete, userId, groupId],
    );
    // Return res
    return res.status(204).end();
  } catch (e) {
    logError('removeAuthorization', e);
    return res.status(400).end();
  }
};
