import { db } from '../../helpers/db';
import { logError } from '../../helpers/logger';
import { checkBasicAuth } from '../helpers/authorizationChecks';
import { inputSanitizer } from '../../helpers/sanitizer';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const updateDeviceMetaData = async (req: any, res: any): Promise<void> => {
  try {
    const deviceName = inputSanitizer.getString(req.body?.deviceName);
    const osVersion = inputSanitizer.getString(req.body?.osVersion);
    const appVersion = inputSanitizer.getString(req.body?.appVersion);

    const basicAuth = await checkBasicAuth(req, { returningDeviceId: true });
    if (!basicAuth.granted) return res.status(401).end();


    const hasDataV2Res = await db.query("SELECT length(encrypted_data_2) AS data2_length FROM users WHERE id=$1", [basicAuth.userId]);
    if(hasDataV2Res.rows[0].data2_length > 0) {
      return res.status(403).json({error: 'deprecated_app'});
    }


    await db.query(
      'UPDATE user_devices SET device_name=$1, os_version=$2, app_version=$3 WHERE id=$4 AND group_id=$5',
      [deviceName, osVersion, appVersion, basicAuth.deviceId, basicAuth.groupId],
    );

    return res.status(200).end();
  } catch (e) {
    logError('updateDeviceMetaData', e);
    return res.status(400).end();
  }
};
