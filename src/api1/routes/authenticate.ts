import { db } from '../../helpers/db';
import { checkDeviceChallengeV1 } from '../helpers/deviceChallengev1';
import { logError, logInfo } from '../../helpers/logger';
import { checkPasswordChallengeV1 } from '../helpers/passwordChallengev1';
import { inputSanitizer } from '../../helpers/sanitizer';
import { SessionStore } from '../../helpers/sessionStore';
import { checkDeviceChallengeV2 } from '../../api2/helpers/deviceChallengev2';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const authenticate = async (req: any, res: any) => {
  try {
    logInfo(req.body?.userEmail, 'authenticateV5');
    const deviceUId = inputSanitizer.getString(req.body?.deviceId);
    const passwordChallengeResponse = inputSanitizer.getString(req.body?.passwordChallengeResponse);
    const deviceChallengeResponse = inputSanitizer.getString(req.body?.deviceChallengeResponse);
    const userEmail = inputSanitizer.getLowerCaseString(req.body?.userEmail);
    const groupId = inputSanitizer.getNumber(req.params.groupId, 1);

    if (!userEmail || !deviceUId || !passwordChallengeResponse || !deviceChallengeResponse) {
      logInfo(req.body?.userEmail, 'authenticateV5 KO: missing body param');
      return res.status(401).end();
    }

    const dbRes = await db.query(
      `SELECT
        u.encrypted_data AS encrypted_data,
        u.encrypted_data_2 AS encrypted_data_2,
        ud.id AS did,
        ud.password_challenge_blocked_until AS password_challenge_blocked_until,
        ud.password_challenge_error_count AS password_challenge_error_count,
        char_length(ud.access_code_hash) > 0 AS has_access_code_hash,
        ud.device_public_key AS device_public_key,
        ud.device_public_key_2 AS device_public_key_2,
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

    if (!dbRes || dbRes.rowCount === 0) {
      logInfo(req.body?.userEmail, 'authenticateV5 KO: not found');
      return res.status(401).end();
    }
    const {
      did,
      has_access_code_hash,
      device_public_key,
      device_public_key_2,
      password_challenge_blocked_until,
      session_auth_challenge_exp_time,
      password_challenge_error_count,
      encrypted_data,
      encrypted_data_2,
      session_auth_challenge,
    } = dbRes.rows[0];

    // 1 - check device uses the new cryptographic authentication mechanism
    if (!!has_access_code_hash && !device_public_key && !device_public_key_2) {
      logInfo(req.body?.userEmail, 'authenticateV5 KO: uses v4 auth');
      return res.status(401).end();
    }

    // 2 - check that the user is not temporarily blocked
    if (
      password_challenge_blocked_until &&
      password_challenge_blocked_until.getTime() > Date.now()
    ) {
      logInfo(req.body?.userEmail, 'authenticateV5 KO: temporaryly blocked');
      return res.status(401).json({
        error: 'blocked',
        nextRetryDate: password_challenge_blocked_until.toISOString(),
      });
    }
    // 3 - check that the session auth challenge has not expired
    if (
      !session_auth_challenge_exp_time ||
      !session_auth_challenge ||
      session_auth_challenge_exp_time.getTime() < Date.now()
    ) {
      logInfo(req.body?.userEmail, 'authenticateV5 KO: token expired');
      return res.status(403).json({ error: 'expired' });
    }

    // 4 - check Password challenge
    const { hasPassedPasswordChallenge, blockedUntil } = await checkPasswordChallengeV1(
      encrypted_data,
      encrypted_data_2,
      passwordChallengeResponse,
      password_challenge_error_count,
      did,
      groupId,
    );
    if (!hasPassedPasswordChallenge) {
      logInfo(req.body?.userEmail, 'authenticateV5 KO: wrong password');
    }
    // 5 - check Device challenge
    let hasPassedDeviceChallenge = false;
    if (!!device_public_key) {
      logInfo(req.body?.userEmail, 'authenticateV5 - checking device challenge v1');
      hasPassedDeviceChallenge = await checkDeviceChallengeV1(
        session_auth_challenge,
        deviceChallengeResponse,
        device_public_key,
      );
    }
    if (!hasPassedDeviceChallenge && !!device_public_key_2) {
      logInfo(req.body?.userEmail, 'authenticateV5 - checking device challenge v2');
      hasPassedDeviceChallenge = await checkDeviceChallengeV2(
        session_auth_challenge,
        deviceChallengeResponse,
        device_public_key_2,
      );
    }
    if (!hasPassedDeviceChallenge) {
      logInfo(req.body?.userEmail, 'authenticateV5 KO: device auth failed');
    }

    const success = hasPassedPasswordChallenge && hasPassedDeviceChallenge;
    if (success) {
      await db.query(
        'UPDATE user_devices SET session_auth_challenge=null, session_auth_challenge_exp_time=null, password_challenge_error_count=0, password_challenge_blocked_until=null WHERE id=$1',
        [did],
      );
      const deviceSession = await SessionStore.createSession({
        groupId,
        deviceUniqueId: deviceUId,
        userEmail,
      });
      return res.status(200).json({
        success,
        deviceSession,
      });
    } else {
      if (blockedUntil) {
        return res.status(401).json({
          error: 'blocked',
          nextRetryDate: blockedUntil.toISOString(),
        });
      } else {
        return res.status(401).end();
      }
    }
  } catch (e) {
    logError(req.body?.userEmail, 'authenticate', e);
    return res.status(400).end();
  }
};
