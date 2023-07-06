import { db } from '../../../helpers/db';
import { checkDeviceRequestAuthorizationV2, createDeviceChallengeV2 } from '../../helpers/deviceChallengev2';
import { logError } from '../../../helpers/logger';
import { inputSanitizer } from '../../../helpers/sanitizer';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const updateDeviceMetaData2 = async (req: any, res: any): Promise<void> => {
  try {
    const groupId = inputSanitizer.getNumber(req.params.groupId, 1);

    const userEmail = inputSanitizer.getLowerCaseString(req.body?.userEmail);
    const deviceUId = inputSanitizer.getString(req.body?.deviceId);
    const deviceChallengeResponse = inputSanitizer.getString(req.body?.deviceChallengeResponse);
    const deviceName = inputSanitizer.getString(req.body?.deviceName);
    const osVersion = inputSanitizer.getString(req.body?.osVersion);
    const appVersion = inputSanitizer.getString(req.body?.appVersion);


    if (!userEmail) return res.status(403).end();
    if (!deviceUId) return res.status(403).end();
    if (!deviceName) return res.status(403).end();
    if (!osVersion) return res.status(403).end();
    if (!appVersion) return res.status(403).end();

    // Request DB
    const dbRes = await db.query(
      'SELECT ' +
      'ud.id AS id, ' +
      'ud.device_public_key AS device_public_key, ' +
      'ud.session_auth_challenge AS session_auth_challenge, ' +
      'ud.session_auth_challenge_exp_time AS session_auth_challenge_exp_time ' +
      'FROM user_devices AS ud ' +
      'INNER JOIN users ON ud.user_id = users.id ' +
      'WHERE ' +
      'users.email=$1 ' +
      'AND ud.device_unique_id = $2 ' +
      "AND ud.authorization_status = 'AUTHORIZED' " +
      'AND users.group_id=$3',
      [userEmail, deviceUId, groupId],
    );

    if (!dbRes || dbRes.rowCount === 0) {
      return res.status(401).end();
    }

    if (!deviceChallengeResponse) {
      const deviceChallenge = await createDeviceChallengeV2(dbRes.rows[0].id);
      return res.status(403).json({ deviceChallenge });
    }

    const isDeviceAuthorized = await checkDeviceRequestAuthorizationV2(
      deviceChallengeResponse,
      dbRes.rows[0].id,
      dbRes.rows[0].session_auth_challenge_exp_time,
      dbRes.rows[0].session_auth_challenge,
      dbRes.rows[0].device_public_key,
    );
    if (!isDeviceAuthorized) return res.status(401).end();

    await db.query(
      'UPDATE user_devices SET device_name=$1, os_version=$2, app_version=$3 WHERE id=$4 AND group_id=$5',
      [deviceName, osVersion, appVersion, dbRes.rows[0].id, groupId],
    );

    return res.status(200).end();
  } catch (e) {
    logError('updateDeviceMetaData2', e);
    return res.status(400).end();
  }
};
