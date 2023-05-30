import { db } from '../../helpers/db';
import { logError } from '../../helpers/logger';
import { isStrictlyLowerVersion } from '../../helpers/appVersionChecker';
import { checkBasicAuth, checkIsManagerForFolder } from '../helpers/authorizationChecks';
import { inputSanitizer } from '../../helpers/sanitizer';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const makeMyselfSoleManagerOfSharedFolder = async (req: any, res: any): Promise<void> => {
  try {
    const appVersion = inputSanitizer.getString(req.body?.appVersion);
    if (isStrictlyLowerVersion(appVersion, '4.5.0')) {
      return res.status(403).send({ error: 'deprecated_app' });
    }

    const sharedFolderId = inputSanitizer.getNumberOrNull(req.body?.sharedFolderId);
    if (sharedFolderId == null) return res.status(401).end();

    const basicAuth = await checkBasicAuth(req);
    if (!basicAuth.granted) return res.status(401).end();

    const isManager = await checkIsManagerForFolder(
      basicAuth.groupId,
      sharedFolderId,
      basicAuth.userId,
    );
    if (!isManager) return res.status(401).end();

    await db.query(
      'UPDATE shared_account_users AS sau SET is_manager=false FROM shared_accounts AS sa WHERE sa.id=sau.shared_account_id AND sa.group_id=$1 AND sau.group_id=$1 AND sa.shared_folder_id=$2 AND sau.user_id!=$3',
      [basicAuth.groupId, sharedFolderId, basicAuth.userId],
    );

    res.status(200).end();
  } catch (e) {
    logError('makeMyselfSoleManagerOfSharedFolder', e);
    return res.status(400).end();
  }
};
