import { db } from '../helpers/connection';
import { accessCodeHash } from '../helpers/accessCodeHash';
import { isExpired } from '../helpers/dateHelper';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const getPasswordBackup = async (req: any, res: any) => {
  try {
    // Get params
    let userEmail = req.body?.userEmail;
    if (!userEmail || typeof userEmail !== 'string') return res.status(401).end();
    userEmail = userEmail.toLowerCase();

    const deviceId = req.body?.deviceId;
    const deviceAccessCode = req.body?.deviceAccessCode;
    const resetToken = req.body?.resetToken;

    // Check params
    if (!deviceId) return res.status(401).end();
    if (!deviceAccessCode) return res.status(401).end();
    if (!resetToken) return res.status(401).end();

    // Request DB
    const dbRes = await db.query(
      `SELECT
        users.id AS userid,
        user_devices.access_code_hash AS access_code_hash,
        user_devices.encrypted_password_backup AS encrypted_password_backup,
        password_reset_request.id AS reset_request_id,
        password_reset_request.status AS reset_status,
        password_reset_request.reset_token AS reset_token,
        password_reset_request.reset_token_expiration_date AS reset_token_expiration_date
      FROM user_devices
        INNER JOIN users ON user_devices.user_id = users.id
        LEFT JOIN password_reset_request ON user_devices.id = password_reset_request.device_id
      WHERE
        users.email=$1
        AND user_devices.device_unique_id = $2
        AND user_devices.authorization_status='AUTHORIZED'
      LIMIT 1`,
      [userEmail, deviceId],
    );

    if (!dbRes || dbRes.rowCount === 0) return res.status(401).end();
    const resetRequest = dbRes.rows[0];

    // Check access code
    const isAccessGranted = await accessCodeHash.asyncIsOk(
      deviceAccessCode,
      resetRequest.access_code_hash,
    );
    if (!isAccessGranted) return res.status(401).end();

    if (!resetRequest.reset_request_id) {
      return res.status(401).json({ error: 'no_request' });
    } else if (resetRequest.reset_token !== resetToken) {
      return res.status(401).json({ error: 'bad_token' });
    } else if (isExpired(resetRequest.reset_token_expiration_date)) {
      return res.status(401).json({ error: 'expired' });
    }

    await db.query(
      `DELETE FROM password_reset_request WHERE id='${resetRequest.reset_request_id}'`,
    );

    // Return res
    return res
      .status(200)
      .json({ encryptedPasswordBackup: resetRequest.encrypted_password_backup });
  } catch (e) {
    console.error('getPasswordBackup', e);
    res.status(400).end();
  }
};
