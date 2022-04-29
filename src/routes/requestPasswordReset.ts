import { v4 as uuidv4 } from 'uuid';
import { db } from '../helpers/db';
import { getExpirationDate, isExpired } from '../helpers/dateHelper';
import { sendPasswordResetRequestEmail } from '../helpers/sendPasswordResetRequestEmail';
import { logError } from '../helpers/logger';
import { checkDeviceRequestAuthorization } from '../helpers/deviceChallenge';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const requestPasswordReset = async (req: any, res: any) => {
  try {
    const groupId = parseInt(req.params.groupId || 1);

    // Get params
    let userEmail = req.body?.userEmail;
    if (!userEmail || typeof userEmail !== 'string') return res.status(401).end();
    userEmail = userEmail.toLowerCase();

    const deviceId = req.body?.deviceId;
    const deviceAccessCode = req.body?.deviceAccessCode; // DEPRECATED
    const deviceChallengeResponse = req.body?.deviceChallengeResponse;

    // Check params
    if (!userEmail) return res.status(401).end();
    if (!deviceId) return res.status(401).end();

    // Request DB
    const authDbRes = await db.query(
      `SELECT
        users.id AS uid,
        user_devices.id AS did,
        user_devices.access_code_hash AS access_code_hash,
        user_devices.device_public_key > 0 AS device_public_key,
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

    if (!authDbRes || authDbRes.rowCount === 0) return res.status(401).end();
    const isDeviceAuthorized = await checkDeviceRequestAuthorization(
      deviceAccessCode,
      authDbRes.rows[0].access_code_hash,
      deviceChallengeResponse,
      authDbRes.rows[0].did,
      authDbRes.rows[0].session_auth_challenge_exp_time,
      authDbRes.rows[0].session_auth_challenge,
      authDbRes.rows[0].device_public_key,
    );
    if (!isDeviceAuthorized) return res.status(401).end();

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
    if (settingRes.rows[0]?.value) {
      // MANUAL VALIDATION IS DISABLED
      const expirationDate = getExpirationDate();
      const randomAuthorizationCode = uuidv4().substring(0, 8);
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
        // TODO notify admin
        return res.status(200).json({ resetStatus: 'pending_admin_check' });
      } else if (resetRequest.reset_status === 'PENDING_ADMIN_CHECK') {
        return res.status(200).json({ resetStatus: 'pending_admin_check' });
      } else if (resetRequest.reset_status === 'ADMIN_AUTHORIZED') {
        return res.status(200).json({ resetStatus: 'mail_sent' });
      }
    }
    logError('requestPasswordReset unmet conditions');
    res.status(400).end();
  } catch (e) {
    logError('requestPasswordReset', e);
    res.status(400).end();
  }
};
