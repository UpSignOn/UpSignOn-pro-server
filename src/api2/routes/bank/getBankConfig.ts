import { db } from '../../../helpers/db';
import { logError, logInfo } from '../../../helpers/logger';
import { getGroupIds } from '../../helpers/bankUUID';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const getBankConfig = async (req: any, res: any): Promise<void> => {
  try {
    const groupIds = await getGroupIds(req);
    const groupRes = await db.query('SELECT name, redirect_url, settings FROM groups WHERE id=$1', [
      groupIds.internalId,
    ]);
    if (groupRes.rowCount === 0) {
      logInfo(req.body?.userEmail, 'getBankConfig fail: bad group');
      return res.status(400).end();
    }
    logInfo(req.body?.userEmail, 'getBankConfig OK');
    return res.status(200).json({
      newUrl:
        groupRes.rows[0].redirect_url ||
        (groupIds.usesDeprecatedIntId
          ? `https://${process.env.API_PUBLIC_HOSTNAME}/${groupIds.publicId}`
          : null),
      bankName: groupRes.rows[0].name,
      preventUpdatePopup: groupRes.rows[0]?.settings?.PREVENT_UPDATE_POPUP || false,
    });
  } catch (e) {
    logError('getBankConfig', e);
    return res.status(400).end();
  }
};
