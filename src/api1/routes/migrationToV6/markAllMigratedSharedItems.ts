import { db } from '../../../helpers/db';
import { logError } from '../../../helpers/logger';
import { checkBasicAuth } from '../../helpers/authorizationChecks';
import { inputSanitizer } from '../../../helpers/sanitizer';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const markAllMigratedSharedItems = async (req: any, res: any): Promise<void> => {
  try {
    const itemIds = inputSanitizer.getArrayOfNumbers(req.body?.itemIds);
    if (itemIds == null) return res.status(401).end();

    const basicAuth = await checkBasicAuth(req);
    if (!basicAuth.granted) return res.status(401).end();

    for (var i = 0; i < itemIds.length; i++) {
      const isManagerRes = await db.query(
        'SELECT is_manager FROM shared_account_users WHERE shared_account_id=$1 AND user_id=$2 AND group_id=$3',
        [i, basicAuth.userId, basicAuth.groupId],
      );
      if (isManagerRes?.rows[0] && isManagerRes.rows[0].is_manager) {
        // NB shared_account_users will be deleted by cascade
        await db.query('UPDATE shared_accounts SET is_migrated=true WHERE id=$1 AND group_id=$2', [
          i,
          basicAuth.groupId,
        ]);
      }
    }
    return res.status(200).end();
  } catch (e) {
    logError('markAllMigratedSharedItems', e);
    return res.status(400).end();
  }
};
