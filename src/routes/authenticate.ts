import { db } from '../helpers/db';
import { checkDeviceChallenge } from '../helpers/deviceChallenge';
import { logError } from '../helpers/logger';
import { checkPasswordChallenge } from '../helpers/passwordChallenge';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const authenticate = async (req: any, res: any) => {
  try {
    const deviceUId = req.body?.deviceId;
    const passwordChallengeResponse = req.body?.passwordChallengeResponse;
    const deviceChallengeResponse = req.body?.deviceChallengeResponse;
    let userEmail = req.body?.userEmail;
    const groupId = parseInt(req.params.groupId || 1);

    if (
      !userEmail ||
      typeof userEmail !== 'string' ||
      !deviceUId ||
      !passwordChallengeResponse ||
      !deviceChallengeResponse
    ) {
      return res.status(401).end();
    }
    userEmail = userEmail.toLowerCase();

    const dbRes = await db.query(
      `SELECT
        u.encrypted_data AS encrypted_data,
        ud.id AS did,
        ud.password_challenge_blocked_until AS password_challenge_blocked_until,
        ud.password_challenge_error_count AS password_challenge_error_count,
        char_length(ud.access_code_hash) > 0 AS has_access_code_hash,
        ud.device_public_key > 0 AS device_public_key,
        ud.session_auth_challenge AS session_auth_challenge,
        ud.session_auth_challenge_exp_time AS session_auth_challenge_exp_time
      FROM user_devices AS ud
      INNER JOIN users AS u ON ud.user_id = u.id
      WHERE
        u.email=$1
        AND ud.device_unique_id = $2
        AND ud.authorization_status='AUTHORIZED'
        AND u.group_id=$3
      `,
      [userEmail, deviceUId, groupId],
    );

    if (!dbRes || dbRes.rowCount === 0) return res.status(401).end();
    const {
      did,
      has_access_code_hash,
      device_public_key,
      password_challenge_blocked_until,
      session_auth_challenge_exp_time,
      password_challenge_error_count,
      encrypted_data,
      session_auth_challenge,
    } = dbRes.rows[0];

    // 1 - check device uses the new cryptographic authentication mechanism
    if (!!has_access_code_hash || !device_public_key) return res.status(401).end();

    // 2 - check that the user is not temporarily blocked
    if (
      password_challenge_blocked_until &&
      password_challenge_blocked_until.getTime() > Date.now()
    ) {
      return res.status(401).json({
        error: 'blocked',
        nextRetryDate: password_challenge_blocked_until.toISOString(),
      });
    }
    // 3 - check that the session auth challenge has not expired
    if (session_auth_challenge_exp_time && session_auth_challenge_exp_time.getTime() < Date.now()) {
      // TODO change this to !() || () after removing the deprecated mechanism
      return res.status(403).json({ error: 'expired' });
    }

    // 4 - check Password challenge
    const hasPassedPasswordChallenge = await checkPasswordChallenge(
      encrypted_data,
      passwordChallengeResponse,
      password_challenge_error_count,
      did,
      groupId,
    );

    // 5 - check Device challenge
    const hasPassedDeviceChallenge = checkDeviceChallenge(
      session_auth_challenge,
      deviceChallengeResponse,
      device_public_key,
    );

    const success = hasPassedPasswordChallenge && hasPassedDeviceChallenge;
    if (success) {
      await db.query(
        'UPDATE user_devices SET session_auth_challenge=null, session_auth_challenge_exp_time=null, password_challenge_error_count=0, password_challenge_blocked_until=null WHERE id=$1',
        [did],
      );
      req.session.groupId = groupId;
      req.session.deviceId = did;
      req.session.deviceUniqueId = deviceUId;
      req.session.userEmail = userEmail;
      return res.status(200).json({
        success,
      });
    } else {
      return res.status(401).end();
    }
  } catch (e) {
    logError('authenticate', e);
    return res.status(400).end();
  }
};