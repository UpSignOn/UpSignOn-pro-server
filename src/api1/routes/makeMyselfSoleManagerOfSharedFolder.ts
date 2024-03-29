import { db } from '../../helpers/db';
import { logError } from '../../helpers/logger';
import { isStrictlyLowerVersion } from '../../helpers/appVersionChecker';
import {
  PREVENT_V1_API_WHEN_V2_DATA,
  checkBasicAuth,
  checkIsManagerForFolder,
} from '../helpers/authorizationChecks';
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

    const hasDataV2Res = await db.query(
      'SELECT length(encrypted_data_2) AS data2_length FROM users WHERE id=$1',
      [basicAuth.userId],
    );
    if (PREVENT_V1_API_WHEN_V2_DATA && hasDataV2Res.rows[0].data2_length > 0) {
      return res.status(403).json({ error: 'deprecated_app' });
    }

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
    logError(req.body?.userEmail, 'makeMyselfSoleManagerOfSharedFolder', e);
    return res.status(400).end();
  }
};
