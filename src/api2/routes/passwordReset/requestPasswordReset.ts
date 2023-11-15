import { db } from '../../../helpers/db';
import { getExpirationDate, isExpired } from '../../../helpers/dateHelper';
import { sendPasswordResetRequestEmail } from '../../../helpers/sendPasswordResetRequestEmail';
import { logError, logInfo } from '../../../helpers/logger';
import {
  checkDeviceRequestAuthorizationV2,
  createDeviceChallengeV2,
} from '../../helpers/deviceChallengev2';
import { inputSanitizer } from '../../../helpers/sanitizer';
import { getRandomString } from '../../../helpers/randomString';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const requestPasswordReset2 = async (req: any, res: any) => {
  try {
    const groupId = inputSanitizer.getNumber(req.params.groupId, 1);

    // Get params
    const userEmail = inputSanitizer.getLowerCaseString(req.body?.userEmail);
    const deviceId = inputSanitizer.getString(req.body?.deviceId);
    const deviceChallengeResponse = inputSanitizer.getString(req.body?.deviceChallengeResponse);

    // Check params
    if (!userEmail) {
      logInfo(req.body?.userEmail, 'requestPasswordReset2 fail: missing userEmail');
      return res.status(403).end();
    }
    if (!deviceId) {
      logInfo(req.body?.userEmail, 'requestPasswordReset2 fail: missing deviceId');
      return res.status(403).end();
    }

    // Request DB
    const authDbRes = await db.query(
      `SELECT
        users.id AS uid,
        user_devices.id AS did,
        user_devices.device_public_key_2 AS device_public_key_2,
        user_devices.session_auth_challenge AS session_auth_challenge,
        user_devices.session_auth_challenge_exp_time AS session_auth_challenge_exp_time
      FROM user_devices
        INNER JOIN users ON user_devices.user_id = users.id
      WHERE
        users.email=$1
        AND user_devices.device_unique_id = $2
        AND user_devices.authorization_status='AUTHORIZED'
        AND user_devices.group_id=$3
      LIMIT 1`,
      [userEmail, deviceId, groupId],
    );

    if (!authDbRes || authDbRes.rowCount === 0) {
      logInfo(req.body?.userEmail, 'requestPasswordReset2 fail: no such authorized device');
      return res.status(401).end();
    }
    if (!deviceChallengeResponse) {
      const deviceChallenge = await createDeviceChallengeV2(authDbRes.rows[0].did);
      logInfo(req.body?.userEmail, 'requestPasswordReset2 fail: sending device challenge');
      return res.status(403).json({ deviceChallenge });
    }
    const isDeviceAuthorized = await checkDeviceRequestAuthorizationV2(
      deviceChallengeResponse,
      authDbRes.rows[0].did,
      authDbRes.rows[0].session_auth_challenge_exp_time,
      authDbRes.rows[0].session_auth_challenge,
      authDbRes.rows[0].device_public_key_2,
    );
    if (!isDeviceAuthorized) {
      logInfo(req.body?.userEmail, 'requestPasswordReset2 fail: device auth failed');
      return res.status(401).end();
    }

    // Request DB
    const dbRes = await db.query(
      `SELECT
        user_devices.id AS device_id,
        user_devices.device_name AS device_name,
        password_reset_request.id AS reset_request_id,
        password_reset_request.status AS reset_status,
        password_reset_request.reset_token_expiration_date AS reset_token_expiration_date
      FROM user_devices
        LEFT JOIN password_reset_request ON user_devices.id = password_reset_request.device_id
      WHERE
        user_devices.user_id=$1
        AND user_devices.device_unique_id = $2
        AND user_devices.group_id=$3
      LIMIT 1`,
      [authDbRes.rows[0].uid, deviceId, groupId],
    );

    const resetRequest = dbRes.rows[0];

    const settingRes = await db.query(
      `SELECT settings->>'DISABLE_MANUAL_VALIDATION_FOR_PASSWORD_FORGOTTEN' AS value FROM groups WHERE id=$1`,
      [groupId],
    );
    if (settingRes.rows[0]?.value === 'true' || settingRes.rows[0]?.value === true) {
      // MANUAL VALIDATION IS DISABLED
      const expirationDate = getExpirationDate();
      const randomAuthorizationCode = getRandomString(8);
      if (!resetRequest.reset_request_id) {
        await db.query(
          `INSERT INTO password_reset_request
              (device_id, status, reset_token, reset_token_expiration_date, group_id)
            VALUES ($1,'ADMIN_AUTHORIZED',$2,$3, $4)
          `,
          [resetRequest.device_id, randomAuthorizationCode, expirationDate, groupId],
        );
      } else {
        await db.query(
          `UPDATE password_reset_request SET
            status='ADMIN_AUTHORIZED',
            reset_token=$1,
            reset_token_expiration_date=$2
          WHERE id=$3 AND group_id=$4`,
          [randomAuthorizationCode, expirationDate, resetRequest.reset_request_id, groupId],
        );
      }
      await sendPasswordResetRequestEmail(
        userEmail,
        resetRequest.device_name,
        randomAuthorizationCode,
        expirationDate,
      );
      logInfo(req.body?.userEmail, 'requestPasswordReset2 OK (reset mail sent)');
      return res.status(200).json({ resetStatus: 'mail_sent' });
    } else {
      // MANUAL VALIDATION IS ENABLED
      if (!resetRequest.reset_request_id) {
        await db.query(
          `INSERT INTO password_reset_request
              (device_id, status, group_id)
            VALUES
              ($1, 'PENDING_ADMIN_CHECK', $2)
          `,
          [resetRequest.device_id, groupId],
        );
        logInfo(req.body?.userEmail, 'requestPasswordReset2 OK (reset request created)');
        // TODO notify admin
        return res.status(200).json({ resetStatus: 'pending_admin_check' });
      } else if (
        !!resetRequest.reset_token_expiration_date &&
        isExpired(resetRequest.reset_token_expiration_date)
      ) {
        // Start a new request
        await db.query(
          `UPDATE password_reset_request SET status='PENDING_ADMIN_CHECK', reset_token=null, reset_token_expiration_date=null WHERE id=$1 AND group_id=$2`,
          [resetRequest.reset_request_id, groupId],
        );
        logInfo(req.body?.userEmail, 'requestPasswordReset2 OK (reset request updated)');
        // TODO notify admin
        return res.status(200).json({ resetStatus: 'pending_admin_check' });
      } else if (resetRequest.reset_status === 'PENDING_ADMIN_CHECK') {
        logInfo(req.body?.userEmail, 'requestPasswordReset2 OK (reset request still pending)');
        return res.status(200).json({ resetStatus: 'pending_admin_check' });
      } else if (resetRequest.reset_status === 'ADMIN_AUTHORIZED') {
        logInfo(req.body?.userEmail, 'requestPasswordReset2 OK (mail sent)');
        return res.status(200).json({ resetStatus: 'mail_sent' });
      }
    }
    logError(req.body?.userEmail, 'requestPasswordReset fail: unmet conditions');
    res.status(400).end();
  } catch (e) {
    logError(req.body?.userEmail, 'requestPasswordReset', e);
    res.status(400).end();
  }
};
