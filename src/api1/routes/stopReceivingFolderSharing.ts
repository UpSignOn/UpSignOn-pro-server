import { db } from '../../helpers/db';
import { logError } from '../../helpers/logger';
import { PREVENT_V1_API_WHEN_V2_DATA, checkBasicAuth } from '../helpers/authorizationChecks';
import { inputSanitizer } from '../../helpers/sanitizer';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const stopReceivingFolderSharing = async (req: any, res: any): Promise<void> => {
  try {
    const folderId = inputSanitizer.getNumberOrNull(req.body?.folderId);
    if (folderId == null) return res.status(401).end();

    const basicAuth = await checkBasicAuth(req);
    if (!basicAuth.granted) return res.status(401).end();

    const hasDataV2Res = await db.query(
      'SELECT length(encrypted_data_2) AS data2_length FROM users WHERE id=$1',
      [basicAuth.userId],
    );
    if (PREVENT_V1_API_WHEN_V2_DATA && hasDataV2Res.rows[0].data2_length > 0) {
      return res.status(403).json({ error: 'deprecated_app' });
    }

    const hasOtherManagersResult = await db.query(
      'SELECT sau.user_id FROM shared_account_users AS sau INNER JOIN shared_account AS sa ON sau.shared_account_id=sa.id WHERE sau.user_id!=$1 AND BOOL_AND(sau.is_manager)=true AND sa.shared_folder_id=$2 AND sau.group_id=$3 GROUP BY sau.user_id',
      [basicAuth.userId, folderId, basicAuth.groupId],
    );
    if (parseInt(hasOtherManagersResult.rows[0].count) === 0) {
      return res.status(401).end();
    }
    await db.query(
      'DELETE FROM shared_account_users WHERE shared_account_id=$1 AND user_id=$2 AND group_id=$3',
      [folderId, basicAuth.userId, basicAuth.groupId],
    );

    return res.status(200).end();
  } catch (e) {
    logError(req.body?.userEmail, 'stopReceivingSharing', e);
    return res.status(400).end();
  }
};
