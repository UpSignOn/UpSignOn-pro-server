import { db } from '../../../helpers/db';
import { logError } from '../../../helpers/logger';
import { inputSanitizer } from '../../../helpers/sanitizer';
import { checkBasicAuth } from '../../helpers/authorizationChecks';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const migrateDeviceAuthenticationKey = async (req: any, res: any) => {
  try {
    const basicAuth = await checkBasicAuth(req, { returningDeviceId: true });
    if (!basicAuth.granted) return res.status(401).end();

    const newDeviceAuthenticationKey = inputSanitizer.getString(
      req.body?.newDeviceAuthenticationKey,
    );
    if (!newDeviceAuthenticationKey) {
      return res.status(403).end();
    }

    const updateRes = await db.query(
      'UPDATE user_devices SET device_public_key_2=$1 WHERE id=$2 AND user_id=$3 AND group_id=$4',
      [newDeviceAuthenticationKey, basicAuth.deviceId, basicAuth.userId, basicAuth.groupId],
    );
    if (updateRes.rowCount != 1) {
      console.error(
        'migrateDeviceAuthenticationKey updated ' + updateRes.rowCount + 'instead of 1',
      );
      return res.status(403).end();
    }
    return res.status(204).end();
  } catch (e) {
    logError(req.body?.userEmail, 'migrateDeviceAuthenticationKey', e);
    return res.status(400).end();
  }
};
