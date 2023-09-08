import { db } from '../../helpers/db';
import { logError } from '../../helpers/logger';
import { checkBasicAuth } from '../helpers/authorizationChecks';
import { inputSanitizer } from '../../helpers/sanitizer';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const deleteSingledSharings = async (req: any, res: any): Promise<void> => {
  try {
    const itemIds = inputSanitizer.getArrayOfNumbers(req.body?.itemIds);
    if (!itemIds) return res.status(401).end();

    const basicAuth = await checkBasicAuth(req);
    if (!basicAuth.granted) return res.status(401).end();



    const hasDataV2Res = await db.query("SELECT length(encrypted_data_2) AS data2_length FROM users WHERE id=$1", [basicAuth.userId]);
    if(hasDataV2Res.rows[0].data2_length > 0) {
      return res.status(403).json({error: 'deprecated_app'});
    }

    for (let i = 0; i < itemIds.length; i++) {
      const itemId = itemIds[i];
      const sharedItemUserDeletion = await db.query(
        `DELETE FROM shared_account_users
        WHERE shared_account_id=$1
        AND user_id=$2
        AND is_manager=true
        AND group_id=$3`,
        [itemId, basicAuth.userId, basicAuth.groupId],
      );
      if (sharedItemUserDeletion.rowCount > 0) {
        await db.query('DELETE FROM shared_accounts WHERE id=$1 AND group_id=$2', [
          itemId,
          basicAuth.groupId,
        ]);
      }
    }

    return res.status(200).end();
  } catch (e) {
    logError('deleteSingledSharings', e);
    return res.status(400).end();
  }
};
