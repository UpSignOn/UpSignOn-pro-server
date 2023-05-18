import { checkBasicAuth } from '../helpers/authorizationChecks';
import { db } from '../../helpers/db';
import { logError } from '../../helpers/logger';
import { inputSanitizer } from '../../helpers/sanitizer';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const changeSharedFolderName = async (req: any, res: any) => {
  try {
    const sharedFolderId = inputSanitizer.getNumberOrNull(req.body?.sharedFolderId);
    const newName = inputSanitizer.getString(req.body?.newName);

    // Check params
    if (!sharedFolderId || !newName) return res.status(401).end();

    const basicAuth = await checkBasicAuth(req);
    if (!basicAuth.granted) return res.status(401).end();

    // check that user is indeed a recipient of the shared folder and is manager of at least one of the items
    const authorizationCheck = await db.query(
      `SELECT COUNT(*) AS count
      FROM shared_folders AS sf
      INNER JOIN shared_accounts AS sa ON sa.shared_folder_id=sf.id
      INNER JOIN shared_account_users AS sau ON sau.shared_account_id=sa.id
      INNER JOIN users AS u ON sau.user_id=u.id
      WHERE sf.group_id=$1 AND sa.group_id=$1 AND sau.group_id=$1 AND u.group_id=$1 AND u.id=$2 AND sf.id=$3 AND sau.is_manager=true`,
      [basicAuth.groupId, basicAuth.userId, sharedFolderId],
    );

    if (!authorizationCheck.rows[0] || authorizationCheck.rows[0].count <= 0) {
      return res.status(401).end();
    }

    await db.query('UPDATE shared_folders SET name=$1 WHERE id=$2', [newName, sharedFolderId]);
    return res.status(200).end();
  } catch (e) {
    logError('changeSharedFolderName', e);
    return res.status(400).end();
  }
};
