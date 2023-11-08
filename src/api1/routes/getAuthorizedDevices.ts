import { db } from '../../helpers/db';
import { logError } from '../../helpers/logger';
import { checkBasicAuth } from '../helpers/authorizationChecks';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const getAuthorizedDevices = async (req: any, res: any) => {
  try {
    const basicAuth = await checkBasicAuth(req);
    if (!basicAuth.granted) return res.status(401).end();

    const devicesRes = await db.query(
      "SELECT device_name, device_unique_id, created_at, device_type, os_version, app_version FROM user_devices WHERE authorization_status='AUTHORIZED' AND user_id=$1 AND group_id=$2",
      [basicAuth.userId, basicAuth.groupId],
    );
    // Return res
    return res.status(200).json({ devices: devicesRes.rows });
  } catch (e) {
    logError(req.body?.userEmail, 'getAuthorizedDevices', e);
    return res.status(400).end();
  }
};
