import crypto from 'crypto';
import { db } from '../helpers/db';
import { isExpired } from '../helpers/dateHelper';
import { logError } from '../helpers/logger';
import { checkDeviceRequestAuthorization, createDeviceChallenge } from '../helpers/deviceChallenge';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const checkDevice = async (req: any, res: any) => {
  try {
    const groupId = parseInt(req.params.groupId || 1);

    // Get params
    let userEmail = req.body?.userEmail;
    if (!userEmail || typeof userEmail !== 'string') return res.status(401).end();
    userEmail = userEmail.toLowerCase();

    const deviceId = req.body?.deviceId;
    const deviceAccessCode = req.body?.deviceAccessCode;
    const deviceChallengeResponse = req.body?.deviceChallengeResponse;
    const deviceValidationCode = req.body?.deviceValidationCode;

    // Check params
    if (!userEmail) return res.status(401).end();
    if (!deviceId) return res.status(401).end();
    if (!deviceValidationCode) return res.status(401).end();

    // Request DB
    const dbRes = await db.query(
      'SELECT ' +
        'ud.id AS id, ' +
        'users.id AS user_id, ' +
        'ud.authorization_code AS authorization_code, ' +
        'ud.access_code_hash AS access_code_hash, ' +
        'ud.auth_code_expiration_date AS auth_code_expiration_date, ' +
        'ud.device_public_key > 0 AS device_public_key, ' +
        'ud.session_auth_challenge AS session_auth_challenge, ' +
        'ud.session_auth_challenge_exp_time AS session_auth_challenge_exp_time ' +
        'FROM user_devices AS ud ' +
        'INNER JOIN users ON ud.user_id = users.id ' +
        'WHERE ' +
        'users.email=$1 ' +
        'AND ud.device_unique_id = $2 ' +
        "AND ud.authorization_status = 'PENDING' " +
        'AND users.group_id=$4',
      [userEmail, deviceId, groupId],
    );

    if (!dbRes || dbRes.rowCount === 0) {
      return res.status(401).json({ revoked: true });
    }

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

    if (!crypto.timingSafeEqual(deviceValidationCode, dbRes.rows[0].authorization_code)) {
      return res.status(401).json({ bad_code: true });
    }
    if (isExpired(dbRes.rows[0].auth_code_expiration_date)) {
      return res.status(401).json({ expired: true });
    }

    await db.query(
      "UPDATE user_devices SET (authorization_status, authorization_code, auth_code_expiration_date) = ('AUTHORIZED', null, null) WHERE id=$1",
      [dbRes.rows[0].id],
    );
    return res.status(200).end();
  } catch (e) {
    logError('checkDevice', e);
    return res.status(400).end();
  }
};
