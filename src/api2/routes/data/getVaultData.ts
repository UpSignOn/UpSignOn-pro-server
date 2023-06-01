import { db } from '../../../helpers/db';
import { logError } from '../../../helpers/logger';
import { inputSanitizer } from '../../../helpers/sanitizer';
import { SessionStore } from '../../../helpers/sessionStore';

/**
 * Returns
 * - 401 or 400
 * - 404 if no user found
 * - 401 with authorizationStatus="PENDING"
 * - 200 with encryptedData
 */

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const getVaultData = async (req: any, res: any): Promise<void> => {
  try {
    const groupId = inputSanitizer.getNumber(req.params.groupId, 1);

    // Get params
    const deviceSession = inputSanitizer.getString(req.body?.deviceSession);
    const userEmail = inputSanitizer.getLowerCaseString(req.body?.userEmail);
    const deviceId = inputSanitizer.getString(req.body?.deviceId);

    // Check params
    if (!userEmail) return res.status(403).end();
    if (!deviceId) return res.status(403).end();
    if (!deviceSession) return res.status(401).end();

    const isSessionOK = await SessionStore.checkSession(deviceSession, {
      userEmail,
      deviceUniqueId: deviceId,
      groupId,
    });
    if (!isSessionOK) return res.status(401).end();

    // Request DB
    const dbRes = await db.query(
      `SELECT
        users.id AS user_id,
        user_devices.authorization_status AS authorization_status,
        users.encrypted_data AS encrypted_data,
        users.updated_at AS updated_at,
        char_length(user_devices.device_public_key) > 0 AS has_device_public_key,
        users.allowed_to_export AS allowed_to_export,
        users.allowed_offline AS allowed_offline
      FROM user_devices
      INNER JOIN users ON user_devices.user_id = users.id
      WHERE
        users.email=$1 AND
        user_devices.device_unique_id = $2 AND
        users.group_id=$3`,
      [userEmail, deviceId, groupId],
    );

    if (!dbRes || dbRes.rowCount === 0) {
      // Check if the email address has changed
      const emailChangeRes = await db.query(
        'SELECT user_id, new_email FROM changed_emails WHERE old_email=$1 AND group_id=$2',
        [userEmail, groupId],
      );
      if (emailChangeRes.rowCount === 0) {
        return res.status(403).json({ error: 'revoked' });
      } else {
        return res.status(403).json({ newEmailAddress: emailChangeRes.rows[0].new_email });
      }
    }
    if (dbRes.rows[0].authorization_status === 'REVOKED_BY_USER') {
      return res.status(403).json({ error: 'revoked' });
    }
    if (dbRes.rows[0].authorization_status === 'REVOKED_BY_ADMIN') {
      return res.status(403).json({ error: 'revoked_by_admin' });
    }

    if (dbRes.rows[0].authorization_status !== 'AUTHORIZED')
      return res.status(403).json({ authorizationStatus: dbRes.rows[0].authorization_status });

    const sharedVaults = await getSharedVaults(dbRes.rows[0].user_id, groupId);

    // Return res
    res.status(200).json({
      encryptedData: dbRes.rows[0].encrypted_data,
      lastUpdatedAt: dbRes.rows[0].updated_at,
      allowedToExport: dbRes.rows[0].allowed_to_export,
      allowedOffline: dbRes.rows[0].allowed_offline,
      sharedVaults,
    });

    // Clean changed_emails table if necessary
    cleanChangedEmails(dbRes.rows[0].user_id, deviceId, groupId);
  } catch (e) {
    logError('getVaultData', e);
    return res.status(400).end();
  }
};

export const getSharedVaults = async (
  userId: number,
  groupId: number,
): Promise<
  {
    id: number;
    name: string;
    isManager: boolean;
    encryptedData: string;
    encryptedKey: string;
    lastUpdatedAt: any;
  }[]
> => {
  const sharedVaultsRes = await db.query(
    `SELECT
      sv.id AS id,
      sv.name AS name,
      sv.encrypted_data AS encrypted_data,
      sv.last_updated_at AS last_updated_at,
      svr.is_manager AS is_manager,
      svr.encrypted_shared_vault_key AS encrypted_shared_vault_key
    FROM shared_vaults AS sv
    INNER JOIN shared_vault_recipients AS svr
    ON svr.shared_vault_id=sv.id
    WHERE svr.user_id=$1
    AND sv.group_id=$2`,
    [userId, groupId],
  );
  return sharedVaultsRes.rows.map((s) => ({
    id: s.id,
    name: s.name,
    encryptedData: s.encrypted_data,
    lastUpdatedAt: s.last_updated_at,
    encryptedKey: s.encrypted_shared_vault_key,
    isManager: s.is_manager,
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
