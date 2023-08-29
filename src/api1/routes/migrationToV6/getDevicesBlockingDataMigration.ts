import { isStrictlyLowerVersion } from '../../../helpers/appVersionChecker';
import { db } from '../../../helpers/db';
import { logError } from '../../../helpers/logger';
import { inputSanitizer } from '../../../helpers/sanitizer';
import { checkBasicAuth } from '../../helpers/authorizationChecks';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const getDevicesBlockingDataMigration = async (req: any, res: any) => {
  try {
    const basicAuth = await checkBasicAuth(req);
    if (!basicAuth.granted) return res.status(401).end();

    // update app version so that this device is no longer blocking the migration
    await db.query("UPDATE user_devices SET app_version=$1 WHERE user_id=$2 AND group_id=$3 AND device_unique_id=$4", [
      inputSanitizer.getString(req.body?.appVersion),
      basicAuth.userId,
      basicAuth.groupId,
      basicAuth.deviceUId
    ]);

    const outdatedDevices = await db.query(
      'SELECT id, device_name, device_type, app_version FROM user_devices WHERE user_id=$1 AND group_id=$2 AND authorization_status = \'AUTHORIZED\' AND device_unique_id!=$3',
      [basicAuth.userId, basicAuth.groupId, basicAuth.deviceUId]
    );

    // Return res
    return res.status(200).json({
      outdatedDevices: outdatedDevices.rows.filter((d)=>{
        if(!d.app_version) return true;
        if(d.app_version === 'N/A') return false;
        return isStrictlyLowerVersion(d.app_version, '6.0.0');
      }),
    });
  } catch (e) {
    logError('getDevicesBlockingDataMigration', e);
    return res.status(400).end();
  }
};
