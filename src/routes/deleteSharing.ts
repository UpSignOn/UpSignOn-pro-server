import { db } from '../helpers/connection';
import { accessCodeHash } from '../helpers/accessCodeHash';
import { logError } from '../helpers/logger';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const deleteSharing = async (req: any, res: any): Promise<void> => {
  try {
    // Get params
    let userEmail = req.body?.userEmail;
    if (!userEmail || typeof userEmail !== 'string') return res.status(401).end();
    userEmail = userEmail.toLowerCase();

    const deviceId = req.body?.deviceId;
    const deviceAccessCode = req.body?.deviceAccessCode;
    const itemId = req.body?.itemId;

    // Check params
    if (!deviceId) return res.status(401).end();
    if (!deviceAccessCode) return res.status(401).end();
    if (!itemId) return res.status(401).end();

    // Request DB
    const dbRes = await db.query(
      `SELECT
        u.id AS user_id,
        ud.access_code_hash AS access_code_hash
      FROM user_devices AS ud
      INNER JOIN users AS u ON ud.user_id = u.id
      INNER JOIN shared_account_users AS sau ON u.id = sau.user_id
      WHERE
        u.email=$1
        AND ud.device_unique_id = $2
        AND sau.shared_account_id = $3
        AND sau.is_manager = true
        AND ud.authorization_status = 'AUTHORIZED'`,
      [userEmail, deviceId, itemId],
    );

    if (!dbRes || dbRes.rowCount === 0) return res.status(401).end();

    // Check access code
    const isAccessGranted = await accessCodeHash.asyncIsOk(
      deviceAccessCode,
      dbRes.rows[0].access_code_hash,
    );
    if (!isAccessGranted) return res.status(401).end();

    await db.query('DELETE FROM shared_account_users WHERE shared_account_id=$1', [itemId]);
    await db.query('DELETE FROM shared_accounts WHERE id=$1', [itemId]);

    return res.status(200).end();
  } catch (e) {
    logError('deleteSharing', e);
    return res.status(400).end();
  }
};
