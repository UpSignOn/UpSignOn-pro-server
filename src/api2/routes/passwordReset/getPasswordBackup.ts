import { db } from '../../../helpers/db';
import { isExpired } from '../../../helpers/dateHelper';
import { logError, logInfo } from '../../../helpers/logger';
import {
  checkDeviceRequestAuthorizationV2,
  createDeviceChallengeV2,
} from '../../helpers/deviceChallengev2';
import { inputSanitizer } from '../../../helpers/sanitizer';
import libsodium from 'libsodium-wrappers';
import { getGroupIds } from '../../helpers/bankUUID';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const getPasswordBackup2 = async (req: any, res: any) => {
  try {
    const groupIds = await getGroupIds(req);

    // Get params
    const userEmail = inputSanitizer.getLowerCaseString(req.body?.userEmail);
    if (!userEmail) {
      logInfo(req.body?.userEmail, 'getPasswordBackup2 fail: missing userEmail');
      return res.status(403).end();
    }

    const deviceId = inputSanitizer.getString(req.body?.deviceId);
    const deviceChallengeResponse = inputSanitizer.getString(req.body?.deviceChallengeResponse);
    const resetToken = inputSanitizer.getString(req.body?.resetToken);

    // Check params
    if (!deviceId) {
      logInfo(req.body?.userEmail, 'getPasswordBackup2 fail: missing deviceId');
      return res.status(403).end();
    }
    if (!resetToken) {
      logInfo(req.body?.userEmail, 'getPasswordBackup2 fail: missing resetToken');
      return res.status(403).end();
    }

    // Request DB
    const deviceRes = await db.query(
      `SELECT
        user_devices.id AS id,
        users.id AS userid,
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
      [userEmail, deviceId, groupIds.internalId],
    );

    if (!deviceRes || deviceRes.rowCount === 0) {
      logInfo(req.body?.userEmail, 'getPasswordBackup2 fail: no such authorized device');
      return res.status(401).end();
    }

    if (!deviceChallengeResponse) {
      const deviceChallenge = await createDeviceChallengeV2(deviceRes.rows[0].id);
      logInfo(req.body?.userEmail, 'getPasswordBackup2 fail: sending device challenge');
      return res.status(403).json({ deviceChallenge });
    }
    const isDeviceAuthorized = await checkDeviceRequestAuthorizationV2(
      deviceChallengeResponse,
      deviceRes.rows[0].id,
      deviceRes.rows[0].session_auth_challenge_exp_time,
      deviceRes.rows[0].session_auth_challenge,
      deviceRes.rows[0].device_public_key_2,
    );
    if (!isDeviceAuthorized) {
      logInfo(req.body?.userEmail, 'getPasswordBackup2 fail: device auth failed');
      return res.status(401).end();
    }

    const existingRequestRes = await db.query(
      `
    SELECT
      user_devices.encrypted_password_backup_2 AS encrypted_password_backup_2,
      password_reset_request.id AS reset_request_id,
      password_reset_request.status AS reset_status,
      password_reset_request.reset_token AS reset_token,
      password_reset_request.reset_token_expiration_date AS reset_token_expiration_date
    FROM user_devices
      LEFT JOIN password_reset_request ON user_devices.id = password_reset_request.device_id
    WHERE
      user_devices.device_unique_id=$1
      AND user_devices.group_id=$2
      AND password_reset_request.status != 'COMPLETED'
    LIMIT 1
    `,
      [deviceId, groupIds.internalId],
    );

    const resetRequest = existingRequestRes.rows[0];
    if (!resetRequest) {
      logInfo(req.body?.userEmail, 'getPasswordBackup2 fail: no reset request found');
      return res.status(401).json({ error: 'no_request' });
    }
    if (resetRequest.reset_status !== 'ADMIN_AUTHORIZED') {
      logInfo(req.body?.userEmail, 'getPasswordBackup2 fail: reset request not admin authorized');
      return res.status(401).json({ error: 'not_admin_authorized' });
    }

    const expectedToken = Buffer.from(resetRequest.reset_token, 'utf-8');
    const inputToken = Buffer.from(resetToken, 'utf-8');
    let tokenMatch = false;
    try {
      tokenMatch = libsodium.memcmp(expectedToken, inputToken);
    } catch (e) {}
    if (!tokenMatch) {
      logInfo(req.body?.userEmail, 'getPasswordBackup2 fail: bad token');
      return res.status(401).json({ error: 'bad_token' });
    } else if (isExpired(resetRequest.reset_token_expiration_date)) {
      logInfo(req.body?.userEmail, 'getPasswordBackup2 fail: token expired');
      return res.status(401).json({ error: 'expired' });
    }

    if (!resetRequest.encrypted_password_backup_2) {
      logInfo(req.body?.userEmail, 'getPasswordBackup2 fail: backup not setup');
      return res.status(403).json({ error: 'backup_not_setup' });
    }

    await db.query(
      `UPDATE password_reset_request SET status='COMPLETED', reset_token=null WHERE id=$1 AND group_id=$2`,
      [resetRequest.reset_request_id, groupIds.internalId],
    );
    await db.query(
      'UPDATE user_devices SET password_challenge_error_count=0, password_challenge_blocked_until=null WHERE device_unique_id=$1 AND group_id=$2',
      [deviceId, groupIds.internalId],
    );
    logInfo(req.body?.userEmail, 'getPasswordBackup2 OK');
    // Return res
    return res
      .status(200)
      .json({ encryptedPasswordBackup: resetRequest.encrypted_password_backup_2 });
  } catch (e) {
    logError(req.body?.userEmail, 'getPasswordBackup', e);
    res.status(400).end();
  }
};
