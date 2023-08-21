import { isStrictlyLowerVersion } from '../../../helpers/appVersionChecker';
import { db } from '../../../helpers/db';
import { logError } from '../../../helpers/logger';
import { checkBasicAuth } from '../../helpers/authorizationChecks';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const getDevicesBlockingDataMigration = async (req: any, res: any) => {
  try {
    const basicAuth = await checkBasicAuth(req);
    if (!basicAuth.granted) return res.status(401).end();

    const outdatedDevices = await db.query(
      'SELECT id, device_name, device_type, app_version FROM user_devices WHERE user_id=$1 AND group_id=$2',
      [basicAuth.userId, basicAuth.groupId]
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
