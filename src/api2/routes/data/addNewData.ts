import { db } from '../../../helpers/db';
import { checkDeviceChallengeV2 } from '../../helpers/deviceChallengev2';
import { logError } from '../../../helpers/logger';
import { hashPasswordChallengeResultForSecureStorageV2 } from '../../helpers/passwordChallengev2';
import { inputSanitizer } from '../../../helpers/sanitizer';
import { SessionStore } from '../../../helpers/sessionStore';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const addNewData2 = async (req: any, res: any): Promise<void> => {
  try {
    const sharingPublicKey = inputSanitizer.getString(req.body?.sharingPublicKey);
    const deviceChallengeResponse = inputSanitizer.getString(req.body?.deviceChallengeResponse);
    const newEncryptedData = inputSanitizer.getString(req.body?.newEncryptedData);
    const deviceUId = inputSanitizer.getString(req.body?.deviceId);
    const userEmail = inputSanitizer.getLowerCaseString(req.body?.userEmail);
    const groupId = inputSanitizer.getNumber(req.params.groupId, 1);

    // 0 - Check params
    if (
      !newEncryptedData ||
      !deviceChallengeResponse ||
      !sharingPublicKey ||
      !userEmail ||
      !deviceUId
    )
      return res.status(403).end();

    const selectRes = await db.query(
      `SELECT
        char_length(u.encrypted_data) > 0 AS has_existing_data,
        u.id AS uid,
        ud.id AS did,
        ud.device_public_key AS device_public_key,
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
    // 1 - check that user data is indeed empty
    if (
      !selectRes ||
      selectRes.rowCount === 0 ||
      selectRes.rows[0].has_existing_data ||
      !selectRes.rows[0].device_public_key ||
      !selectRes.rows[0].session_auth_challenge
    ) {
      return res.status(403).json({ error: 'conflict' });
    }

    // 2 - check that the session auth challenge has not expired
    if (
      !selectRes.rows[0].session_auth_challenge_exp_time ||
      !selectRes.rows[0].session_auth_challenge ||
      selectRes.rows[0].session_auth_challenge_exp_time.getTime() < Date.now()
    ) {
      return res.status(403).json({ error: 'expired' });
    }

    // 3 - check Device challenge
    const hasPassedDeviceChallenge = await checkDeviceChallengeV2(
      selectRes.rows[0].session_auth_challenge,
      deviceChallengeResponse,
      selectRes.rows[0].device_public_key,
    );

    if (!hasPassedDeviceChallenge) {
      return res.status(401).end();
    }

    const newEncryptedDataWithPasswordChallengeSecured =
      hashPasswordChallengeResultForSecureStorageV2(newEncryptedData);
    // 4 - Do the update
    const updateRes = await db.query(
      'UPDATE users SET (encrypted_data, updated_at, sharing_public_key)=($1, CURRENT_TIMESTAMP(0), $2) WHERE users.email=$3 AND users.group_id=$4 RETURNING updated_at',
      [newEncryptedDataWithPasswordChallengeSecured, sharingPublicKey, userEmail, groupId],
    );
    if (updateRes.rowCount === 0) {
      // CONFLICT
      return res.status(403).end();
    }

    // Set Session
    const deviceSession = await SessionStore.createSession({
      groupId,
      deviceUniqueId: deviceUId,
      userEmail,
    });

    return res.status(200).json({ lastUpdatedAt: updateRes.rows[0].updated_at, deviceSession });
  } catch (e) {
    logError('addNewData2', e);
    return res.status(400).end();
  }
};
