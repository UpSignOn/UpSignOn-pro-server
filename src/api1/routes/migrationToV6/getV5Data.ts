import { db } from '../../../helpers/db';
import { logError } from '../../../helpers/logger';
import { checkBasicAuth2 } from '../../../api2/helpers/authorizationChecks';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const getV5Data = async (req: any, res: any): Promise<void> => {
  try {
    const basicAuth = await checkBasicAuth2(req);
    if (!basicAuth.granted) return res.status(401).end();

    const dbRes = await db.query('SELECT encrypted_data FROM users WHERE id=$1 AND group_id=$2', [
      basicAuth.userId,
      basicAuth.groupId,
    ]);
    const sharingRes = await db.query(
      `SELECT
        sa.id AS id,
        sa.type AS type,
        sa.url AS url,
        sa.name AS name,
        sa.login AS login,
        sa.aes_encrypted_data AS aes_encrypted_data,
        sau.is_manager AS is_manager,
        sau.encrypted_aes_key AS encrypted_aes_key,
        (SELECT COUNT(user_id) FROM shared_account_users WHERE shared_account_id=sau.shared_account_id) < 2 AS has_single_user,
        sf.id as shared_folder_id,
        sf.name as shared_folder_name,
        sa.is_migrated as is_migrated
      FROM shared_accounts AS sa
      INNER JOIN shared_account_users AS sau
      ON sau.shared_account_id=sa.id
      LEFT JOIN shared_folders AS sf ON sf.id=sa.shared_folder_id
      WHERE sau.user_id=$1
      AND sa.group_id=$2`,
      [basicAuth.userId, basicAuth.groupId],
    );
    const sharedItems = sharingRes.rows.map((s) => ({
      id: s.id,
      type: s.type,
      url: s.url,
      name: s.name,
      login: s.login,
      aesEncryptedData: s.aes_encrypted_data,
      encryptedAesKey: s.encrypted_aes_key,
      isManager: s.is_manager,
      hasSingleUser: s.has_single_user,
      sharedFolderId: s.shared_folder_id,
      sharedFolderName: s.shared_folder_name,
      isMigrated: s.is_migrated,
    }));
    return res.status(200).json({
      encryptedData: dbRes.rows[0]?.encrypted_data,
      sharedItems: sharedItems,
    });
  } catch (e) {
    logError(req.body?.userEmail, 'getV5Data', e);
    return res.status(400).end();
  }
};
