import { db } from '../../helpers/db';
import { accessCodeHash } from '../helpers/accessCodeHash';
import { getExpirationDate, isExpired } from '../../helpers/dateHelper';
import { sendDeviceRequestEmail } from '../../helpers/sendDeviceRequestEmail';
import { logError } from '../../helpers/logger';
import { inputSanitizer } from '../../helpers/sanitizer';
import { getRandomString } from '../../helpers/randomString';

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
    const groupId = inputSanitizer.getNumber(req.params.groupId, 1);

    // Get params
    const userEmail = inputSanitizer.getLowerCaseString(req.body?.userEmail);
    const emailRegex = /^([a-zA-Z0-9_\-\.]+)@([a-zA-Z0-9_\-\.]+).([a-zA-Z]{2,5})$/g;
    if (!userEmail || !emailRegex.test(userEmail)) return res.status(401).end();

    const deviceId = inputSanitizer.getString(req.body?.deviceId);
    const deviceAccessCode = inputSanitizer.getString(req.body?.deviceAccessCode); // DEPRECATED
    const devicePublicKey = inputSanitizer.getString(req.body?.devicePublicKey); // NEW SYSTEM
    const deviceName = inputSanitizer.getString(req.body?.deviceName);
    const deviceType = inputSanitizer.getString(req.body?.deviceType);
    const deviceOS = inputSanitizer.getString(req.body?.deviceOS);
    const appVersion = inputSanitizer.getString(req.body?.appVersion);

    // Check params
    if (!deviceId) return res.status(401).end();

    // Request DB
    let userRes = await db.query('SELECT id FROM users WHERE email=$1 AND group_id=$2', [
      userEmail,
      groupId,
    ]);
    if (userRes.rowCount === 0) {
      // make sure email address is allowed
      const emailRes = await db.query('SELECT pattern FROM allowed_emails WHERE group_id=$1', [
        groupId,
      ]);
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
      userRes = await db.query('INSERT INTO users (email, group_id) VALUES ($1,$2) RETURNING id', [
        userEmail,
        groupId,
      ]);
    }
    const userId = userRes.rows[0].id;

    const deviceRes = await db.query(
      'SELECT id, authorization_status, authorization_code, auth_code_expiration_date FROM user_devices WHERE user_id=$1 AND device_unique_id=$2 AND group_id=$3',
      [userId, deviceId, groupId],
    );

    if (deviceRes.rowCount > 0 && deviceRes.rows[0].authorization_status === 'AUTHORIZED') {
      return res.status(200).json({ authorizationStatus: 'AUTHORIZED' });
    } else if (
      deviceRes.rowCount > 0 &&
      deviceRes.rows[0].authorization_status === 'PENDING' &&
      !isExpired(deviceRes.rows[0].auth_code_expiration_date)
    ) {
      // resend email
      await sendDeviceRequestEmail(
        userEmail,
        deviceName,
        deviceType,
        deviceOS,
        deviceRes.rows[0].authorization_code,
        deviceRes.rows[0].auth_code_expiration_date,
      );
      return res.status(200).json({ authorizationStatus: 'PENDING' });
    }

    const hashedAccessCode = !!deviceAccessCode
      ? await accessCodeHash.asyncHash(deviceAccessCode)
      : null;
    const randomAuthorizationCode = getRandomString(8);
    const expirationDate = getExpirationDate();
    if (deviceRes.rowCount === 0) {
      if (!hashedAccessCode && !devicePublicKey) return res.status(401).end();
      await db.query(
        'INSERT INTO user_devices (user_id, device_name, device_type, os_version, app_version, device_unique_id, access_code_hash, device_public_key, authorization_status, authorization_code, auth_code_expiration_date, group_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)',
        [
          userId,
          deviceName,
          deviceType,
          deviceOS,
          appVersion,
          deviceId,
          hashedAccessCode,
          devicePublicKey,
          'PENDING',
          randomAuthorizationCode,
          expirationDate,
          groupId,
        ],
      );
    } else {
      // request is pending and expired, let's update it
      await db.query(
        'UPDATE user_devices SET (device_name, access_code_hash, authorization_status, authorization_code, auth_code_expiration_date) = ($1,$2,$3,$4,$5) WHERE user_id=$6 AND device_unique_id=$7 AND group_id=$8',
        [
          deviceName,
          hashedAccessCode,
          'PENDING',
          randomAuthorizationCode,
          expirationDate,
          userId,
          deviceId,
          groupId,
        ],
      );
    }

    await sendDeviceRequestEmail(
      userEmail,
      deviceName,
      deviceType,
      deviceOS,
      randomAuthorizationCode,
      new Date(expirationDate),
    );

    // Return res
    return res.status(204).end();
  } catch (e) {
    logError('requestAccess', e);
    res.status(400).end();
  }
};
