import { db } from '../../../helpers/db';
import {
  checkDeviceRequestAuthorizationV2,
  createDeviceChallengeV2,
} from '../../helpers/deviceChallengev2';
import { logError, logInfo } from '../../../helpers/logger';
import { inputSanitizer } from '../../../helpers/sanitizer';
import { getBankIds } from '../../helpers/bankUUID';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const updateDeviceMetaData2 = async (req: any, res: any): Promise<void> => {
  try {
    const bankIds = await getBankIds(req);

    const userEmail = inputSanitizer.getLowerCaseString(req.body?.userEmail);
    const deviceUId = inputSanitizer.getString(req.body?.deviceId);
    const deviceChallengeResponse = inputSanitizer.getString(req.body?.deviceChallengeResponse);
    const deviceName = inputSanitizer.getString(req.body?.deviceName);
    const osFamily = inputSanitizer.getString(req.body?.osFamily);
    const osNameAndVersion = inputSanitizer.getString(
      req.body?.osNameAndVersion || req.body?.osVersion,
    );
    const deviceType = inputSanitizer.getString(req.body?.deviceType);
    const installType = inputSanitizer.getString(req.body?.installType);
    const appVersion = inputSanitizer.getString(req.body?.appVersion);

    if (!userEmail) {
      logInfo(req.body?.userEmail, 'updateDeviceMetaData2 fail: missing user email');
      return res.status(403).end();
    }
    if (!deviceUId) {
      logInfo(req.body?.userEmail, 'updateDeviceMetaData2 fail: missing deviceUID');
      return res.status(403).end();
    }
    if (!deviceName) {
      logInfo(req.body?.userEmail, 'updateDeviceMetaData2 fail: missing deviceName');
      return res.status(403).end();
    }
    if (!osNameAndVersion) {
      logInfo(req.body?.userEmail, 'updateDeviceMetaData2 fail: missing osNameAndVersion');
      return res.status(403).end();
    }
    if (!appVersion) {
      logInfo(req.body?.userEmail, 'updateDeviceMetaData2 fail: missing appVersion');
      return res.status(403).end();
    }

    // Request DB
    const dbRes = await db.query(
      'SELECT ' +
        'ud.id AS id, ' +
        'ud.device_public_key_2 AS device_public_key_2, ' +
        'ud.session_auth_challenge AS session_auth_challenge, ' +
        'ud.session_auth_challenge_exp_time AS session_auth_challenge_exp_time ' +
        'FROM user_devices AS ud ' +
        'INNER JOIN users ON ud.user_id = users.id ' +
        'WHERE ' +
        'users.email=$1 ' +
        'AND ud.device_unique_id = $2 ' +
        'AND users.bank_id=$3',
      [userEmail, deviceUId, bankIds.internalId],
    );

    if (!dbRes || dbRes.rowCount === 0) {
      logInfo(req.body?.userEmail, 'updateDeviceMetaData2 fail: device deleted');
      return res.status(401).json({ error: 'device_deleted' });
    }

    if (!deviceChallengeResponse) {
      const deviceChallenge = await createDeviceChallengeV2(dbRes.rows[0].id);
      logInfo(req.body?.userEmail, 'updateDeviceMetaData2 fail: sending device challenge');
      return res.status(403).json({ deviceChallenge });
    }

    const isDeviceAuthorized = await checkDeviceRequestAuthorizationV2(
      deviceChallengeResponse,
      dbRes.rows[0].id,
      dbRes.rows[0].session_auth_challenge_exp_time,
      dbRes.rows[0].session_auth_challenge,
      dbRes.rows[0].device_public_key_2,
    );
    if (!isDeviceAuthorized) {
      logInfo(req.body?.userEmail, 'updateDeviceMetaData2 fail: device auth failed');
      return res.status(401).end();
    }

    await db.query(
      'UPDATE user_devices SET device_name=$1, os_version=$2, app_version=$3 WHERE id=$4 AND bank_id=$5',
      [deviceName, osNameAndVersion, appVersion, dbRes.rows[0].id, bankIds.internalId],
    );
    if (osFamily && deviceType && installType) {
      // sent after version 7.5 of the app
      await db.query(
        'UPDATE user_devices SET os_family=$1, device_type=$2, install_type=$3 WHERE id=$4 AND bank_id=$5',
        [osFamily, deviceType, installType, dbRes.rows[0].id, bankIds.internalId],
      );
    }
    logInfo(req.body?.userEmail, 'updateDeviceMetaData2 OK');
    return res.status(200).end();
  } catch (e) {
    logError(req.body?.userEmail, 'updateDeviceMetaData2', e);
    return res.status(400).end();
  }
};
