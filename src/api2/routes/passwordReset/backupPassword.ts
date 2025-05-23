import { db } from '../../../helpers/db';
import { logError, logInfo } from '../../../helpers/logger';
import { inputSanitizer } from '../../../helpers/sanitizer';
import { checkBasicAuth2 } from '../../helpers/authorizationChecks';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const backupPassword2 = async (req: any, res: any) => {
  try {
    const backups = inputSanitizer.getArrayOfBackups(req.body?.backups);
    if (!backups) {
      logInfo(req.body?.userEmail, 'backupPassword2 fail: missing backups param');
      return res.status(403).end();
    }

    const basicAuth = await checkBasicAuth2(req);
    if (!basicAuth.granted) {
      logInfo(req.body?.userEmail, 'backupPassword2 fail: auth not granted');
      return res.status(401).end();
    }

    await Promise.all(
      backups.map((backup) =>
        db.query(
          "UPDATE user_devices SET encrypted_password_backup_2=$1 WHERE device_unique_id=$2 AND user_id=$3 AND authorization_status='AUTHORIZED' AND group_id=$4",
          [
            backup.encryptedPassword,
            backup.deviceId,
            basicAuth.userId,
            basicAuth.groupIds.internalId,
          ],
        ),
      ),
    );
    logInfo(req.body?.userEmail, 'backupPassword2 OK');
    // Return res
    return res.status(204).end();
  } catch (e) {
    logError(req.body?.userEmail, 'backupPassword2', e);
    return res.status(400).end();
  }
};
