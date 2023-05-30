import { db } from '../../helpers/db';
import { logError } from '../../helpers/logger';
import { checkBasicAuth, checkIsManagerForFolder } from '../helpers/authorizationChecks';
import { inputSanitizer } from '../../helpers/sanitizer';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const updateContactSharedFolderRights = async (req: any, res: any): Promise<void> => {
  try {
    const contactId = inputSanitizer.getNumberOrNull(req.body?.contactId);
    const folderId = inputSanitizer.getNumberOrNull(req.body?.folderId);
    const willBeManager = inputSanitizer.getBoolean(req.body.willBeManager);
    if (contactId == null) return res.status(401).end();
    if (folderId == null) return res.status(401).end();
    if (typeof willBeManager === 'undefined') return res.status(401).end();

    const basicAuth = await checkBasicAuth(req);
    if (!basicAuth.granted) return res.status(401).end();

    if (basicAuth.userId === contactId) {
      // prevent someone from removing oneself their manager rights
      // to make sure there is always at least one manager for each item
      return res.status(401).end();
    }

    // check that user is manager of this folder
    const isFolderManager = await checkIsManagerForFolder(
      basicAuth.groupId,
      folderId,
      basicAuth.userId,
    );
    if (!isFolderManager) {
      return res.status(401).end();
    }

    const updateRes = await db.query(
      'UPDATE shared_account_users AS sau SET is_manager=$1 FROM shared_accounts AS sa WHERE sa.id=sau.shared_account_id AND sa.shared_folder_id=$2 AND sau.user_id=$3 AND sau.group_id=$4',
      [willBeManager, folderId, contactId, basicAuth.groupId],
    );

    if (updateRes.rowCount === 0) return res.status(400).end();

    return res.status(200).end();
  } catch (e) {
    logError('updateContactSharedFolderRights', e);
    return res.status(400).end();
  }
};
