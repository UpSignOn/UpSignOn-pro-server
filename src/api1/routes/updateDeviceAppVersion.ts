import { db } from '../../helpers/db';
import { logError } from '../../helpers/logger';
import { checkBasicAuth } from '../helpers/authorizationChecks';
import { inputSanitizer } from '../../helpers/sanitizer';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const updateDeviceAppVersion = async (req: any, res: any): Promise<void> => {
  try {
    const deviceId = inputSanitizer.getString(req.body?.deviceId);
    const groupId = inputSanitizer.getNumber(req.params.groupId, 1);
    const appVersion = inputSanitizer.getString(req.body?.appVersion);

    await db.query(
      'UPDATE user_devices SET app_version=$1 WHERE device_unique_id=$2 AND group_id=$3',
      [appVersion, deviceId, groupId],
    );

    return res.status(200).end();
  } catch (e) {
    logError(req.body?.userEmail, 'updateDeviceAppVersion', e);
    return res.status(400).end();
  }
};
