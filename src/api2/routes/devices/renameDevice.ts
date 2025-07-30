import { db } from '../../../helpers/db';
import { logError, logInfo } from '../../../helpers/logger';
import { inputSanitizer } from '../../../helpers/sanitizer';
import { checkBasicAuth2 } from '../../helpers/authorizationChecks';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const renameDevice2 = async (req: any, res: any) => {
  try {
    const deviceToRename = inputSanitizer.getString(req.body?.deviceToRename);
    const newName = inputSanitizer.getString(req.body?.newName);
    if (!deviceToRename) {
      logInfo(req.body?.userEmail, 'renameDevice2 fail: missing deviceToRename');
      return res.status(403).end();
    }
    if (!newName) {
      logInfo(req.body?.userEmail, 'renameDevice2 fail: missing newName');
      return res.status(403).end();
    }

    const basicAuth = await checkBasicAuth2(req);
    if (!basicAuth.granted) {
      logInfo(req.body?.userEmail, 'renameDevice2 fail: auth not granted');
      return res.status(401).end();
    }

    await db.query(
      'UPDATE user_devices SET device_name=$1 WHERE user_id=$2 AND device_unique_id=$3 AND bank_id=$4',
      [newName, basicAuth.userId, deviceToRename, basicAuth.bankIds.internalId],
    );
    logInfo(req.body?.userEmail, 'renameDevice2 OK');
    // Return res
    return res.status(204).end();
  } catch (e) {
    logError(req.body?.userEmail, 'renameDevice', e);
    return res.status(400).end();
  }
};
