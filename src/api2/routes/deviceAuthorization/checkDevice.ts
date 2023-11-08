import { db } from '../../../helpers/db';
import { isExpired } from '../../../helpers/dateHelper';
import { logError } from '../../../helpers/logger';
import {
  checkDeviceRequestAuthorizationV2,
  createDeviceChallengeV2,
} from '../../helpers/deviceChallengev2';
import { inputSanitizer } from '../../../helpers/sanitizer';
import libsodium from 'libsodium-wrappers';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const checkDevice2 = async (req: any, res: any) => {
  try {
    const groupId = inputSanitizer.getNumber(req.params.groupId, 1);

    // Get params
    const userEmail = inputSanitizer.getLowerCaseString(req.body?.userEmail);
    const deviceId = inputSanitizer.getString(req.body?.deviceId);
    const deviceChallengeResponse = inputSanitizer.getString(req.body?.deviceChallengeResponse);
    const deviceValidationCode = inputSanitizer.getString(req.body?.deviceValidationCode);

    // Check params
    if (!userEmail) return res.status(403).end();
    if (!deviceId) return res.status(403).end();
    if (!deviceValidationCode) return res.status(403).end();

    // Request DB
    const dbRes = await db.query(
      'SELECT ' +
        'ud.id AS id, ' +
        'users.id AS user_id, ' +
        'ud.authorization_code AS authorization_code, ' +
        'ud.authorization_status AS authorization_status, ' +
        'ud.auth_code_expiration_date AS auth_code_expiration_date, ' +
        'ud.device_public_key_2 AS device_public_key_2, ' +
        'ud.session_auth_challenge AS session_auth_challenge, ' +
        'ud.session_auth_challenge_exp_time AS session_auth_challenge_exp_time ' +
        'FROM user_devices AS ud ' +
        'INNER JOIN users ON ud.user_id = users.id ' +
        'WHERE ' +
        'users.email=$1 ' +
        'AND ud.device_unique_id = $2 ' +
        "AND ud.authorization_status != 'REVOKED_BY_ADMIN' " +
        "AND ud.authorization_status != 'REVOKED_BY_USER' " +
        'AND users.group_id=$3',
      [userEmail, deviceId, groupId],
    );

    if (!dbRes || dbRes.rowCount === 0) {
      return res.status(403).json({ error: 'revoked' });
    }

    if (dbRes.rows[0].authorization_status !== 'PENDING') {
      return res.status(200).end();
    }
    if (!deviceChallengeResponse) {
      const deviceChallenge = await createDeviceChallengeV2(dbRes.rows[0].id);
      return res.status(401).json({ deviceChallenge });
    }

    const isDeviceAuthorized = await checkDeviceRequestAuthorizationV2(
      deviceChallengeResponse,
      dbRes.rows[0].id,
      dbRes.rows[0].session_auth_challenge_exp_time,
      dbRes.rows[0].session_auth_challenge,
      dbRes.rows[0].device_public_key_2,
    );
    if (!isDeviceAuthorized) return res.status(401).end();

    const deviceValidationCodeBuffer = Buffer.from(deviceValidationCode, 'utf-8');
    const expectedAuthCodeBuffer = Buffer.from(dbRes.rows[0].authorization_code, 'utf-8');
    let codeMatch = false;
    try {
      codeMatch = libsodium.memcmp(deviceValidationCodeBuffer, expectedAuthCodeBuffer);
    } catch (e) {}
    if (!codeMatch) {
      return res.status(403).json({ error: 'bad_code' });
    }
    if (isExpired(dbRes.rows[0].auth_code_expiration_date)) {
      return res.status(403).json({ error: 'expired_code' });
    }

    await db.query(
      "UPDATE user_devices SET (authorization_status, authorization_code, auth_code_expiration_date) = ('AUTHORIZED', null, null) WHERE id=$1",
      [dbRes.rows[0].id],
    );
    return res.status(200).end();
  } catch (e) {
    logError(req.body?.userEmail, 'checkDevice2', e);
    return res.status(400).end();
  }
};
