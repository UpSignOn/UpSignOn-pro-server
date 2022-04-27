import { Buffer } from 'buffer';
import crypto from 'crypto';
import { db } from '../helpers/db';
import { logError } from '../helpers/logger';

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
        ud.session_auth_challenge AS session_auth_challenge
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

    // 1 - check device uses the new cryptographic authentication mechanism
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
      return res.status(401).json({ error: 'expired' });
    }

    // 4 - check Password challenge
    let data = encrypted_data;
    if (!data.startsWith('formatP001-')) {
      return res.status(401).end();
    }
    data = data.replace('formatP001-', '');
    const dataBuffer = Buffer.from(data, 'base64'); // dataBuffer = [challenge(16 bytes) | challengeHash(32 bytes) | cipherSignature(32 bytes) | derivationKeySalt(64 bytes) | iv(16 bytes) | cipher(?)]

    const expectedPwdChallengeResult = Buffer.alloc(16);
    dataBuffer.copy(expectedPwdChallengeResult, 0, 16, 48);
    const passwordChallengeResponseBuffer = Buffer.from(passwordChallengeResponse, 'base64');

    const hasPassedPasswordChallenge = crypto.timingSafeEqual(
      expectedPwdChallengeResult,
      passwordChallengeResponseBuffer,
    );

    // 5 - check Device challenge
    const publicKey = Buffer.from(device_public_key, 'base64');
    const deviceChallenge = Buffer.from(session_auth_challenge, 'base64');
    const deviceChallengeResponseBytes = Buffer.from(deviceChallengeResponse, 'base64');
    const hasPassedDeviceChallenge = crypto.verify(
      'RSA_PKCS1_PADDING',
      deviceChallenge,
      publicKey,
      deviceChallengeResponseBytes,
    );

    // Add a time constraint to the number of failed attempts per device
    if (!hasPassedPasswordChallenge) {
      // 3 attempts with no delay, then 1 minute for each additional previous failed attempt
      if (password_challenge_error_count <= 2) {
        await db.query(
          'UPDATE user_devices SET password_challenge_error_count=password_challenge_error_count+1, password_challenge_blocked_until=null WHERE id=$1',
          [did],
        );
      } else {
        const minRetryDate = new Date();
        minRetryDate.setTime(Date.now() + 60 * (password_challenge_error_count - 2) * 1000);
        await db.query(
          'UPDATE user_devices SET password_challenge_error_count=password_challenge_error_count+1, password_challenge_blocked_until=$1 WHERE id=$2',
          [minRetryDate.toISOString(), did],
        );
      }
    }

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
    }

    return res.status(200).json({
      success,
    });
  } catch (e) {
    logError('authenticate', e);
    return res.status(400).end();
  }
};
