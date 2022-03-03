import { db } from '../helpers/connection';
import { logError } from '../helpers/logger';
import { isStrictlyLowerVersion } from '../helpers/appVersionChecker';
import { checkBasicAuth } from '../helpers/authorizationChecks';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const addSharedItemsToSharedFolder = async (req: any, res: any): Promise<void> => {
  try {
    const appVersion = req.body?.appVersion;
    if (isStrictlyLowerVersion(appVersion, '4.5.0')) {
      return res.status(403).send({ error: 'deprecated_app' });
    }

    const sharedItemIds = req.body?.sharedItemIds;
    const sharedFolderId = req.body?.sharedFolderId;
    if (!sharedItemIds || !Array.isArray(sharedItemIds) || !sharedFolderId)
      return res.status(401).end();

    const basicAuth = await checkBasicAuth(req);
    if (!basicAuth.granted) return res.status(401).end();

    for (let i = 0; i < sharedItemIds.length; i++) {
      await db.query(
        'UPDATE shared_accounts SET shared_folder_id=$1 WHERE (SELECT is_manager FROM shared_account_users WHERE user_id=$4 AND shared_account_users.shared_account_id=shared_accounts.id AND group_id=$3) AND id=$2 AND group_id=$3',
        [sharedFolderId, sharedItemIds[i], basicAuth.groupId, basicAuth.userId],
      );
    }

    res.status(200).end();
  } catch (e) {
    logError('addSharedItemsToSharedFolder', e);
    return res.status(400).end();
  }
};
