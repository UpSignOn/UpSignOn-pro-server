import { db } from '../helpers/connection';
import { logError } from '../helpers/logger';
import { checkBasicAuth } from '../helpers/authorizationChecks';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const renameDevice = async (req: any, res: any) => {
  try {
    const deviceToRename = req.body?.deviceToRename;
    const newName = req.body?.newName;
    if (!deviceToRename) return res.status(401).end();
    if (!newName) return res.status(401).end();

    const basicAuth = await checkBasicAuth(req);
    if (!basicAuth.granted) return res.status(401).end();

    await db.query(
      'UPDATE user_devices SET device_name=$1 WHERE user_id=$2 AND device_unique_id=$3 AND group_id=$4',
      [newName, basicAuth.userId, deviceToRename, basicAuth.groupId],
    );
    // Return res
    return res.status(204).end();
  } catch (e) {
    logError('renameDevice', e);
    return res.status(400).end();
  }
};
