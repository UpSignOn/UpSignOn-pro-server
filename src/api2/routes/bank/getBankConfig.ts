import { db } from '../../../helpers/db';
import { logError, logInfo } from '../../../helpers/logger';
import { inputSanitizer } from '../../../helpers/sanitizer';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const getBankConfig = async (req: any, res: any): Promise<void> => {
  try {
    // TODO do not use a number ?
    const groupId = inputSanitizer.getNumber(req.params.groupId, 1);

    const groupRes = await db.query('SELECT name, redirect_url, settings FROM groups WHERE id=$1', [
      groupId,
    ]);
    if (groupRes.rowCount === 0) {
      logInfo(req.body?.userEmail, 'getBankConfig fail: bad group');
      return res.status(400).end();
    }
    logInfo(req.body?.userEmail, 'getBankConfig OK');
    return res.status(200).json({
      newUrl: groupRes.rows[0].redirect_url,
      bankName: groupRes.rows[0].name,
      preventUpdatePopup: groupRes.rows[0]?.settings?.PREVENT_UPDATE_POPUP || false,
    });
  } catch (e) {
    logError('getBankConfig', e);
    return res.status(400).end();
  }
};
