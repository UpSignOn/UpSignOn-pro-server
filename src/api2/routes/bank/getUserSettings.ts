import { db } from '../../../helpers/db';
import { logError } from '../../../helpers/logger';
import { checkBasicAuth2 } from '../../helpers/authorizationChecks';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const getUserSettings = async (req: any, res: any): Promise<void> => {
  try {
    const basicAuth = await checkBasicAuth2(req);
    if (!basicAuth.granted) return res.status(401).end();

    const userSettingsRes = await db.query(
      'SELECT allowed_to_export, allowed_offline FROM users WHERE id=$1 AND group_id=$2',
      [basicAuth.userId, basicAuth.groupId],
    );


    // Return res
    return res.status(200).json({ allowedToExport: userSettingsRes.rows[0].allowed_to_export, allowedOffline: userSettingsRes.rows[0].allowed_offline });
  } catch (e) {
    logError('getUserSettings', e);
    return res.status(400).end();
  }
};
