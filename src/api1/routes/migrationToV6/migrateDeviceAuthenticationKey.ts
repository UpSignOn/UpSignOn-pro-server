import { db } from '../../../helpers/db';
import { logError } from '../../../helpers/logger';
import { inputSanitizer } from '../../../helpers/sanitizer';
import { checkBasicAuth } from '../../helpers/authorizationChecks';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const migrateDeviceAuthenticationKey = async (req: any, res: any) => {
  try {
    const basicAuth = await checkBasicAuth(req);
    if (!basicAuth.granted) return res.status(401).end();

    const newDeviceAuthenticationKey = inputSanitizer.getString(req.body?.newDeviceAuthenticationKey);
    if(!newDeviceAuthenticationKey) {
      return res.status(403).end();
    }

    await db.query(
      'UPDATE user_device SET device_public_key=$1 WHERE id=$2 AND user_id=$3 AND group_id=$4',
      [newDeviceAuthenticationKey, basicAuth.deviceId, basicAuth.userId, basicAuth.groupId]
    );
    return res.status(204).end();
  } catch (e) {
    logError('migrateDeviceAuthenticationKey', e);
    return res.status(400).end();
  }
};
