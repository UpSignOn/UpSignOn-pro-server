import { db } from '../../../helpers/db';
import { logError } from '../../../helpers/logger';
import { checkBasicAuth2 } from '../../helpers/authorizationChecks';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const getAuthorizedDevices2 = async (req: any, res: any) => {
  try {
    const basicAuth = await checkBasicAuth2(req);
    if (!basicAuth.granted) return res.status(401).end();

    const devicesRes = await db.query(
      "SELECT device_name, device_unique_id, created_at, device_type, os_version, app_version FROM user_devices WHERE authorization_status='AUTHORIZED' AND user_id=$1 AND group_id=$2",
      [basicAuth.userId, basicAuth.groupId],
    );
    // Return res
    return res.status(200).json({
      devices: devicesRes.rows.map((d) => ({
        deviceName: d.device_name,
        deviceId: d.device_unique_id,
        createdAt: d.created_at,
        deviceType: d.device_type,
        osVersion: d.os_version,
        appVersion: d.app_version,
      })),
    });
  } catch (e) {
    logError(req.body?.userEmail, 'getAuthorizedDevices', e);
    return res.status(400).end();
  }
};
