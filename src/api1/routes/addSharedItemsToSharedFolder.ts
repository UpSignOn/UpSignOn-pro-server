import { db } from '../../helpers/db';
import { logError } from '../../helpers/logger';
import { isStrictlyLowerVersion } from '../../helpers/appVersionChecker';
import { PREVENT_V1_API_WHEN_V2_DATA, checkBasicAuth } from '../helpers/authorizationChecks';
import { inputSanitizer } from '../../helpers/sanitizer';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const addSharedItemsToSharedFolder = async (req: any, res: any): Promise<void> => {
  try {
    const appVersion = inputSanitizer.getString(req.body?.appVersion);
    if (isStrictlyLowerVersion(appVersion, '4.5.0')) {
      return res.status(403).send({ error: 'deprecated_app' });
    }

    const sharedItemIds = inputSanitizer.getArrayOfNumbers(req.body?.sharedItemIds);
    const sharedFolderId = inputSanitizer.getNumberOrNull(req.body?.sharedFolderId);
    if (!sharedItemIds || sharedFolderId == null) return res.status(401).end();

    const basicAuth = await checkBasicAuth(req);
    if (!basicAuth.granted) return res.status(401).end();

    const hasDataV2Res = await db.query(
      'SELECT length(encrypted_data_2) AS data2_length FROM users WHERE id=$1',
      [basicAuth.userId],
    );
    if (PREVENT_V1_API_WHEN_V2_DATA && hasDataV2Res.rows[0].data2_length > 0) {
      return res.status(403).json({ error: 'deprecated_app' });
    }

    for (let i = 0; i < sharedItemIds.length; i++) {
      await db.query(
        'UPDATE shared_accounts SET shared_folder_id=$1 WHERE (SELECT is_manager FROM shared_account_users WHERE user_id=$4 AND shared_account_users.shared_account_id=shared_accounts.id AND shared_account_users.group_id=$3) AND shared_accounts.id=$2 AND shared_accounts.group_id=$3',
        [sharedFolderId, sharedItemIds[i], basicAuth.groupId, basicAuth.userId],
      );
    }

    res.status(200).end();
  } catch (e) {
    logError(req.body?.userEmail, 'addSharedItemsToSharedFolder', e);
    return res.status(400).end();
  }
};
