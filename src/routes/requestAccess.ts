import { v4 as uuidv4 } from 'uuid';
import { db } from '../helpers/connection';
import { accessCodeHash } from '../helpers/accessCodeHash';
import { getExpirationDate, isExpired } from '../helpers/dateHelper';
import { sendDeviceRequestEmail } from '../helpers/sendDeviceRequestEmail';
import env from '../helpers/env';

// TESTS
// - if I request access for a user that does not exist, it creates the user and the device request
// - if I request access for an existing user but a new device, it creates the device request
// - if I request access for an existing user and an existing device
//      - if the request is still pending or already accepted, return 401 with status
//      - if the request has expired, generate a new one

// returns
// - 400 if an error occured
// - 401 if the request was malformed
// - 401 with authorizationStatus = "PENDING"|"AUTHORIZED" (with mail resent)
// - 401 with error = email_address_not_allowed
// - 204

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const requestAccess = async (req: any, res: any) => {
  try {
    // Get params
    const userEmail = req.body?.userEmail;
    const deviceId = req.body?.deviceId;
    const deviceName = req.body?.deviceName;
    const deviceAccessCode = req.body?.deviceAccessCode;

    // Check params
    if (!userEmail || userEmail.indexOf('@') === -1) return res.status(401).end();
    if (!deviceId) return res.status(401).end();
    if (!deviceName) return res.status(401).end();
    if (!deviceAccessCode) return res.status(401).end();

    // Request DB
    let userRes = await db.query('SELECT id FROM users WHERE email=$1', [userEmail]);
    if (userRes.rowCount === 0) {
      // make sure email address is allowed
      const emailRes = await db.query('SELECT pattern from allowed_emails');
      if (
        !emailRes.rows.some((emailPattern) => {
          if (emailPattern.pattern.indexOf('*@') === 0) {
            return userEmail.split('@')[1] === emailPattern.pattern.replace('*@', '');
          } else {
            return userEmail === emailPattern.pattern;
          }
        })
      )
        return res.status(401).json({ error: 'email_address_not_allowed' });
      userRes = await db.query('INSERT INTO users (email) VALUES ($1) RETURNING id', [userEmail]);
    }
    const userId = userRes.rows[0].id;

    const deviceRes = await db.query(
      'SELECT id, authorization_status, authorization_code, auth_code_expiration_date FROM user_devices WHERE user_id=$1 AND device_unique_id=$2',
      [userId, deviceId],
    );

    if (
      deviceRes.rowCount > 0 &&
      (deviceRes.rows[0].authorization_status !== 'PENDING' ||
        !isExpired(deviceRes.rows[0].auth_code_expiration_date))
    ) {
      if (deviceRes.rows[0].authorization_status === 'PENDING') {
        // resend email
        await sendDeviceRequestEmail(
          userEmail,
          deviceName,
          env.API_PUBLIC_HOSTNAME,
          deviceRes.rows[0].id,
          deviceRes.rows[0].authorization_code,
        );
      }
      return res.status(401).json({ authorizationStatus: deviceRes.rows[0].authorization_status });
    }

    const hashedAccessCode = await accessCodeHash.asyncHash(deviceAccessCode);
    const randomAuthorizationCode = uuidv4();
    const expirationDate = getExpirationDate();
    let requestId;
    if (deviceRes.rowCount === 0) {
      const insertRes = await db.query(
        'INSERT INTO user_devices (user_id, device_name, device_unique_id, access_code_hash, authorization_status, authorization_code, auth_code_expiration_date) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id',
        [
          userId,
          deviceName,
          deviceId,
          hashedAccessCode,
          'PENDING',
          randomAuthorizationCode,
          expirationDate,
        ],
      );
      requestId = insertRes.rows[0].id;
    } else {
      const updateRes = await db.query(
        'UPDATE user_devices SET (device_name, access_code_hash, authorization_status, authorization_code, auth_code_expiration_date) = ($1,$2,$3,$4,$5) WHERE user_id=$6 AND device_unique_id=$7 RETURNING id',
        [
          deviceName,
          hashedAccessCode,
          'PENDING',
          randomAuthorizationCode,
          expirationDate,
          userId,
          deviceId,
        ],
      );
      requestId = updateRes.rows[0].id;
    }

    await sendDeviceRequestEmail(
      userEmail,
      deviceName,
      env.API_PUBLIC_HOSTNAME,
      requestId,
      randomAuthorizationCode,
    );

    // Return res
    return res.status(204).end();
  } catch (e) {
    console.error(e);
    res.status(400).end();
  }
};
