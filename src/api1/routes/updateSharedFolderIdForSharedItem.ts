import { db } from '../../helpers/db';
import { logError } from '../../helpers/logger';
import { isStrictlyLowerVersion } from '../../helpers/appVersionChecker';
import { PREVENT_V1_API_WHEN_V2_DATA, checkBasicAuth } from '../helpers/authorizationChecks';
import { inputSanitizer } from '../../helpers/sanitizer';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const updateSharedFolderIdForSharedItem = async (req: any, res: any): Promise<void> => {
  try {
    const appVersion = inputSanitizer.getString(req.body?.appVersion);
    if (isStrictlyLowerVersion(appVersion, '4.5.0')) {
      return res.status(403).send({ error: 'deprecated_app' });
    }

    const sharedItemId = inputSanitizer.getNumberOrNull(req.body?.itemId);
    const newSharedFolderId = inputSanitizer.getString(req.body?.newSharedFolderId);
    if (sharedItemId == null) return res.status(401).end();

    const basicAuth = await checkBasicAuth(req, { checkIsManagerForItemId: sharedItemId });
    if (!basicAuth.granted) return res.status(401).end();

    const hasDataV2Res = await db.query(
      'SELECT length(encrypted_data_2) AS data2_length FROM users WHERE id=$1',
      [basicAuth.userId],
    );
    if (PREVENT_V1_API_WHEN_V2_DATA && hasDataV2Res.rows[0].data2_length > 0) {
      return res.status(403).json({ error: 'deprecated_app' });
    }

    // check is manager for destination folder
    await db.query(
      'SELECT is_manager FROM shared_account_users WHERE user_id=$1 AND shared_account_id=$2 AND group_id=$3',
      [basicAuth.userId, sharedItemId, basicAuth.groupId],
    );

    if (newSharedFolderId) {
      await db.query('UPDATE shared_accounts SET shared_folder_id=$1 WHERE id=$2', [
        parseInt(newSharedFolderId),
        sharedItemId,
      ]);
    } else {
      await db.query('UPDATE shared_accounts SET shared_folder_id=NULL WHERE id=$1', [
        sharedItemId,
      ]);
    }

    return res.status(200).end();
  } catch (e) {
    logError(req.body?.userEmail, 'updateSharedFolderIdForSharedItem', e);
    return res.status(400).end();
  }
};
