import { db } from '../helpers/connection';
import { logError } from '../helpers/logger';
import { checkBasicAuth } from '../helpers/authorizationChecks';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const getContactsForSharedFolder = async (req: any, res: any) => {
  try {
    const folderId = req.body?.folderId;
    if (!folderId) return res.status(401).end();

    const basicAuth = await checkBasicAuth(req);
    if (!basicAuth.granted) return res.status(401).end();

    const contactRes = await db.query(
      `SELECT u.email, u.id, BOOL_AND(sau.is_manager) AS is_folder_manager
    FROM users AS u
    INNER JOIN shared_account_users AS sau ON sau.user_id=u.id
    INNER JOIN shared_accounts AS sa ON sa.id=sau.shared_account_id
    INNER JOIN shared_folders AS sf ON sa.shared_folder_id=sf.id
    WHERE u.group_id=$1 AND sau.group_id=$1 AND sa.group_id=$1 AND sf.group_id=$1
    AND sf.id=$2
    GROUP BY u.id, u.email
    `,
      [basicAuth.groupId, folderId],
    );
    if (!contactRes.rows.some((c) => c.id === basicAuth.userId)) {
      return res.status(401).end();
    }

    // Return res
    return res.status(200).json({ contacts: contactRes.rows });
  } catch (e) {
    logError('getContactsForSharedItem', e);
    return res.status(400).end();
  }
};
