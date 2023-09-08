import { db } from '../../helpers/db';
import { logError } from '../../helpers/logger';
import { checkBasicAuth, checkIsManagerForFolder } from '../helpers/authorizationChecks';
import { inputSanitizer } from '../../helpers/sanitizer';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const stopSharingFolderWithContact = async (req: any, res: any): Promise<void> => {
  try {
    const contactId = inputSanitizer.getNumberOrNull(req.body?.contactId);
    const folderId = inputSanitizer.getNumberOrNull(req.body?.folderId);
    if (contactId == null) return res.status(401).end();
    if (folderId == null) return res.status(401).end();

    const basicAuth = await checkBasicAuth(req);
    if (!basicAuth.granted) return res.status(401).end();



    const hasDataV2Res = await db.query("SELECT length(encrypted_data_2) AS data2_length FROM users WHERE id=$1", [basicAuth.userId]);
    if(hasDataV2Res.rows[0].data2_length > 0) {
      return res.status(403).json({error: 'deprecated_app'});
    }

    // it is not authorized to remove oneself (to make sure there is always at least one contact for each item)
    if (basicAuth.userId === contactId) return res.status(401).end();

    // check that user is manager of this folder
    const isFolderManager = await checkIsManagerForFolder(
      basicAuth.groupId,
      folderId,
      basicAuth.userId,
    );
    if (!isFolderManager) {
      return res.status(401).end();
    }

    const deleteRes = await db.query(
      'DELETE FROM shared_account_users AS sau USING shared_accounts AS sa WHERE sa.id=sau.shared_account_id AND sau.user_id=$1 AND sa.shared_folder_id=$2 AND sau.group_id=$3',
      [contactId, folderId, basicAuth.groupId],
    );

    if (deleteRes.rowCount === 0) return res.status(400).end();

    return res.status(200).end();
  } catch (e) {
    logError('stopSharingFolderWithContact', e);
    return res.status(400).end();
  }
};
