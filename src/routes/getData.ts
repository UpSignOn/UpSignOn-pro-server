import { db } from '../helpers/connection';
import { accessCodeHash } from '../helpers/accessCodeHash';
import { logError } from '../helpers/logger';

/**
 * Returns
 * - 401 or 400
 * - 404 if no user found
 * - 401 with authorizationStatus="PENDING"
 * - 200 with encryptedData
 */

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const getData = async (req: any, res: any): Promise<void> => {
  try {
    const groupId = parseInt(req.params.groupId || 1);

    // Get params
    let userEmail = req.body?.userEmail;
    if (!userEmail || typeof userEmail !== 'string') return res.status(401).end();
    userEmail = userEmail.toLowerCase();

    const deviceId = req.body?.deviceId;
    const deviceAccessCode = req.body?.deviceAccessCode;

    // Check params
    if (!userEmail) return res.status(401).end();
    if (!deviceId) return res.status(401).end();
    if (!deviceAccessCode) return res.status(401).end();

    // Request DB
    const dbRes = await db.query(
      'SELECT users.id AS user_id, user_devices.authorization_status AS authorization_status, user_devices.access_code_hash AS access_code_hash, users.encrypted_data AS encrypted_data, users.updated_at AS updated_at FROM user_devices INNER JOIN users ON user_devices.user_id = users.id WHERE users.email=$1 AND user_devices.device_unique_id = $2  AND users.group_id=$3',
      [userEmail, deviceId, groupId],
    );

    if (!dbRes || dbRes.rowCount === 0) {
      // Check if the email address has changed
      const emailChangeRes = await db.query(
        'SELECT user_id, new_email FROM changed_emails WHERE old_email=$1 AND group_id=$2',
        [userEmail, groupId],
      );
      if (emailChangeRes.rowCount === 0) {
        return res.status(404).json({ error: 'revoked' });
      } else {
        return res.status(401).json({ newEmailAddress: emailChangeRes.rows[0].new_email });
      }
    }
    if (
      dbRes.rows[0].authorization_status === 'REVOKED_BY_ADMIN' ||
      dbRes.rows[0].authorization_status === 'REVOKED_BY_USER'
    )
      return res.status(404).json({ error: 'revoked' });

    if (dbRes.rows[0].authorization_status !== 'AUTHORIZED')
      return res.status(401).json({ authorizationStatus: dbRes.rows[0].authorization_status });

    // Check access code
    const isAccessGranted = await accessCodeHash.asyncIsOk(
      deviceAccessCode,
      dbRes.rows[0].access_code_hash,
    );
    if (!isAccessGranted) return res.status(401).end();

    const sharedItems = await getSharedItems(dbRes.rows[0].user_id, groupId);

    // Return res
    res.status(200).json({
      encryptedData: dbRes.rows[0].encrypted_data,
      lastUpdateDate: dbRes.rows[0].updated_at,
      sharedItems,
    });

    // Clean changed_emails table if necessary
    cleanChangedEmails(dbRes.rows[0].user_id, deviceId, groupId);
  } catch (e) {
    logError('getData', e);
    return res.status(400).end();
  }
};

export const getSharedItems = async (
  userId: number,
  groupId: number,
): Promise<
  {
    id: number;
    type: string;
    url: null | string;
    name: null | string;
    login: null | string;
    isManager: boolean;
    encryptedPassword: string;
    aesEncryptedData: string;
    encryptedAesKey: string;
    sharedFolderId: null | number;
    sharedFolderName: null | string;
  }[]
> => {
  const sharingRes = await db.query(
    `SELECT
      sa.id AS id,
      sa.type AS type,
      sa.url AS url,
      sa.name AS name,
      sa.login AS login,
      sa.aes_encrypted_data AS aes_encrypted_data,
      sau.is_manager AS is_manager,
      sau.encrypted_password AS encrypted_password,
      sau.encrypted_aes_key AS encrypted_aes_key,
      (SELECT COUNT(user_id) FROM shared_account_users WHERE shared_account_id=sau.shared_account_id) < 2 AS has_single_user,
      sf.id as shared_folder_id,
      sf.name as shared_folder_name
    FROM shared_accounts AS sa
    INNER JOIN shared_account_users AS sau
    ON sau.shared_account_id=sa.id
    LEFT JOIN shared_folders AS sf ON sf.id=sa.shared_folder_id
    WHERE sau.user_id=$1
    AND sa.group_id=$2`,
    [userId, groupId],
  );
  return sharingRes.rows.map((s) => ({
    id: s.id,
    type: s.type,
    url: s.url,
    name: s.name,
    login: s.login,
    aesEncryptedData: s.aes_encrypted_data,
    encryptedAesKey: s.encrypted_aes_key,
    isManager: s.is_manager,
    encryptedPassword: s.encrypted_password,
    hasSingleUser: s.has_single_user,
    sharedFolderId: s.shared_folder_id,
    sharedFolderName: s.shared_folder_name,
  }));
};

const cleanChangedEmails = async (userId: number, deviceUniqueId: string, groupId: number) => {
  try {
    const changedEmails = await db.query(
      'SELECT aware_devices FROM changed_emails WHERE user_id = $1 AND group_id=$2',
      [userId, groupId],
    );
    if (changedEmails.rowCount > 0) {
      // get all devices for this user
      const devices = await db.query(
        'SELECT id, device_unique_id FROM user_devices WHERE user_id=$1 AND group_id=$2',
        [userId, groupId],
      );

      let areAllDevicesAware = true;
      devices.rows.forEach(async (d) => {
        if (!changedEmails.rows[0].aware_devices.includes(d.id)) {
          if (d.device_unique_id === deviceUniqueId) {
            // do update all changed_emails for user_id and not only for changed_emails wher old_email = userEmail
            // because this will help make sure the database cleans itself automatically in the end
            await db.query(
              'UPDATE changed_emails SET aware_devices=$1 WHERE user_id=$2 AND group_id=$3',
              [JSON.stringify([...changedEmails.rows[0].aware_devices, d.id]), userId, groupId],
            );
          } else {
            areAllDevicesAware = false;
          }
        }
      });
      if (areAllDevicesAware) {
        await db.query('DELETE FROM changed_emails WHERE user_id=$1 AND group_id=$2', [
          userId,
          groupId,
        ]);
      }
    }
  } catch (e) {
    logError('cleanChangedEmails:', e);
  }
};
