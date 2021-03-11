import { v4 as uuidv4 } from 'uuid';
import { db } from '../helpers/connection';
import { accessCodeHash } from '../helpers/accessCodeHash';
import { getExpirationDate, isExpired } from '../helpers/dateHelper';
import { sendPasswordResetRequestEmail } from '../helpers/sendPasswordResetRequestEmail';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const requestPasswordReset = async (req: any, res: any) => {
  try {
    // Get params
    const userEmail = req.body?.userEmail;
    const deviceId = req.body?.deviceId;
    const deviceAccessCode = req.body?.deviceAccessCode;

    // Check params
    if (!userEmail) return res.status(401).end();
    if (!deviceId) return res.status(401).end();
    if (!deviceAccessCode) return res.status(401).end();

    // Request DB
    const dbRes = await db.query(
      `SELECT
        users.id AS userid,
        user_devices.authorization_status AS authorization_status,
        user_devices.access_code_hash AS access_code_hash,
        user_devices.id AS device_id,
        user_devices.device_name AS device_name,
        password_reset_request.id AS reset_request_id,
        password_reset_request.status AS reset_status,
        password_reset_request.reset_token_expiration_date AS reset_token_expiration_date
      FROM user_devices
        INNER JOIN users ON user_devices.user_id = users.id
        LEFT JOIN password_reset_request ON user_devices.id = password_reset_request.device_id
      WHERE
        users.email=$1
        AND user_devices.device_unique_id = $2
      LIMIT 1`,
      [userEmail, deviceId],
    );

    if (!dbRes || dbRes.rowCount === 0) return res.status(401).end();
    const resetRequest = dbRes.rows[0];
    if (resetRequest.authorization_status !== 'AUTHORIZED') return res.status(401).end();

    // Check access code
    const isAccessGranted = await accessCodeHash.asyncIsOk(
      deviceAccessCode,
      resetRequest.access_code_hash,
    );
    if (!isAccessGranted) return res.status(401).end();

    if (
      resetRequest.reset_status === 'PENDING' &&
      !isExpired(resetRequest.reset_token_expiration_date)
    ) {
      return res.status(200).json({ resetStatus: 'PENDING' });
    }

    const expirationDate = getExpirationDate();
    const randomAuthorizationCode = uuidv4().substring(0, 8);

    if (resetRequest.reset_request_id) {
      await db.query(
        `UPDATE password_reset_request SET
          status='PENDING',
          reset_token='${randomAuthorizationCode}',
          reset_token_expiration_date='${expirationDate}'
        WHERE id='${resetRequest.reset_request_id}'`,
      );
    } else {
      await db.query(
        `INSERT INTO password_reset_request
          (device_id, status, reset_token, reset_token_expiration_date)
        VALUES
          ('${resetRequest.device_id}', 'PENDING', '${randomAuthorizationCode}', '${expirationDate}')
      `,
      );
    }
    await sendPasswordResetRequestEmail(
      userEmail,
      resetRequest.device_name,
      randomAuthorizationCode,
      expirationDate,
    );

    // Return res
    return res.status(204).end();
  } catch (e) {
    console.error(e);
    res.status(400).end();
  }
};
