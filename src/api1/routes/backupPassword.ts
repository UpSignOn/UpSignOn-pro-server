import { checkBasicAuth } from '../helpers/authorizationChecks';
import { db } from '../../helpers/db';
import { logError } from '../../helpers/logger';
import { inputSanitizer } from '../../helpers/sanitizer';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const backupPassword = async (req: any, res: any) => {
  try {
    const backups = inputSanitizer.getArrayOfBackups(req.body?.backups);
    if (!backups) return res.status(401).end();

    const basicAuth = await checkBasicAuth(req);
    if (!basicAuth.granted) return res.status(401).end();



    const hasDataV2Res = await db.query("SELECT length(encrypted_data_2) AS data2_length FROM users WHERE id=$1", [basicAuth.userId]);
    if(hasDataV2Res.rows[0].data2_length > 0) {
      return res.status(403).json({error: 'deprecated_app'});
    }

    await Promise.all(
      backups.map((backup) =>
        db.query(
          "UPDATE user_devices SET encrypted_password_backup=$1 WHERE device_unique_id=$2 AND user_id=$3 AND authorization_status='AUTHORIZED' AND group_id=$4",
          [backup.encryptedPassword, backup.deviceId, basicAuth.userId, basicAuth.groupId],
        ),
      ),
    );
    // Return res
    return res.status(204).end();
  } catch (e) {
    logError('backupPassword', e);
    return res.status(400).end();
  }
};
