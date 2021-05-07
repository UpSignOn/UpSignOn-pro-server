import { db } from '../helpers/connection';
import { accessCodeHash } from '../helpers/accessCodeHash';

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
      'SELECT users.id AS user_id, user_devices.authorization_status AS authorization_status, user_devices.access_code_hash AS access_code_hash, users.encrypted_data AS encrypted_data, users.updated_at AS updated_at FROM user_devices INNER JOIN users ON user_devices.user_id = users.id WHERE users.email=$1 AND user_devices.device_unique_id = $2',
      [userEmail, deviceId],
    );

    if (!dbRes || dbRes.rowCount === 0) return res.status(404).json({ error: 'revoked' });
    if (dbRes.rows[0].authorization_status !== 'AUTHORIZED')
      return res.status(401).json({ authorizationStatus: dbRes.rows[0].authorization_status });

    // Check access code
    const isAccessGranted = await accessCodeHash.asyncIsOk(
      deviceAccessCode,
      dbRes.rows[0].access_code_hash,
    );
    if (!isAccessGranted) return res.status(401).end();

    const sharedItems = await getSharedItems(dbRes.rows[0].user_id);

    // Return res
    return res.status(200).json({
      encryptedData: dbRes.rows[0].encrypted_data,
      lastUpdateDate: dbRes.rows[0].updated_at,
      sharedItems,
    });
  } catch (e) {
    console.error('getData', e);
    return res.status(400).end();
  }
};

export const getSharedItems = async (
  userId: number,
): Promise<
  {
    id: number;
    type: string;
    url: null | string;
    name: null | string;
    login: null | string;
    isManager: boolean;
    encryptedPassword: string;
  }[]
> => {
  const sharingRes = await db.query(
    `SELECT
      sa.id AS id,
      sa.type AS type,
      sa.url AS url,
      sa.name AS name,
      sa.login AS login,
      sau.is_manager AS is_manager,
      sau.encrypted_password AS encrypted_password
    FROM shared_accounts AS sa
    INNER JOIN shared_account_users AS sau
    ON sau.shared_account_id=sa.id
    WHERE sau.user_id=${userId}`,
  );
  return sharingRes.rows.map((s) => ({
    id: s.id,
    type: s.type,
    url: s.url,
    name: s.name,
    login: s.login,
    isManager: s.is_manager,
    encryptedPassword: s.encrypted_password,
  }));
};
