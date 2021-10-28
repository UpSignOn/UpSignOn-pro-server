import { db } from '../helpers/connection';
import { logError } from '../helpers/logger';
import { checkBasicAuth } from '../helpers/authorizationChecks';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const removeAuthorization = async (req: any, res: any) => {
  try {
    const basicAuth = await checkBasicAuth(req);
    if (!basicAuth.granted) return res.status(401).end();

    const deviceToDelete = req.body?.deviceToDelete || basicAuth.deviceUId;

    await db.query(
      "UPDATE user_devices SET device_unique_id=null, authorization_status='REVOKED_BY_USER', access_code_hash='', encrypted_password_backup='', revocation_date=$1 WHERE device_unique_id=$2 AND user_id=$3 AND group_id=$4",
      [new Date().toISOString(), deviceToDelete, basicAuth.userId, basicAuth.groupId],
    );
    // Return res
    return res.status(204).end();
  } catch (e) {
    logError('removeAuthorization', e);
    return res.status(400).end();
  }
};
