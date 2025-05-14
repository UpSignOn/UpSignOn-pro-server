import { db } from '../../../helpers/db';
import { getExpirationDate, isExpired } from '../../../helpers/dateHelper';
import { sendDeviceRequestEmail } from '../../../helpers/sendDeviceRequestEmail';
import { logError, logInfo } from '../../../helpers/logger';
import { inputSanitizer } from '../../../helpers/sanitizer';
import { getRandomString } from '../../../helpers/randomString';
import {
  GROUP_SETTINGS,
  USER_SETTINGS_OVERRIDE,
} from '../../../helpers/getDefaultSettingOrUserOverride';
import { isAllowedOnPlatform } from '../../../helpers/isAllowedOnPlatform';
import { getEmailAuthorizationStatus } from '../../helpers/emailAuthorization';
import { MicrosoftGraph } from 'ms-entra-for-upsignon';
import { getGroupIds } from '../../helpers/bankUUID';

// TESTS
// - if I request access for a user that does not exist, it creates the user and the device request
// - if I request access for an existing user but a new device, it creates the device request
// - if I request access for an existing user and an existing device
//      - if the request is still pending or already accepted, return 401 with status
//      - if the request has expired, generate a new one

// returns
// - 400 if an error occured
// - 400 if the request was malformed
// - 400 with authorizationStatus = "PENDING"|"AUTHORIZED" (with mail resent)
// - 403 with error = email_address_not_allowed
// - 204

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const requestDeviceAccess2 = async (req: any, res: any) => {
  try {
    const groupIds = await getGroupIds(req);

    // Get params
    const userEmail = inputSanitizer.getLowerCaseString(req.body?.userEmail);
    const emailRegex = /^([a-zA-Z0-9_\-\.+]+)@([a-zA-Z0-9_\-\.]+).([a-zA-Z]{2,5})$/g;
    if (!userEmail || !emailRegex.test(userEmail)) {
      logInfo(req.body?.userEmail, 'requestDeviceAccess2 fail: not a valid email');
      return res.status(400).end();
    }

    const deviceId = inputSanitizer.getString(req.body?.deviceId);
    const devicePublicKey = inputSanitizer.getString(req.body?.devicePublicKey);
    const deviceName = inputSanitizer.getString(req.body?.deviceName);
    const deviceType = inputSanitizer.getString(req.body?.deviceType);
    const installType = inputSanitizer.getString(req.body?.installType);
    const osFamily = inputSanitizer.getString(req.body?.osFamily);
    // fallback to req.body.osVersion for backwards compatibility
    const osNameAndVersion = inputSanitizer.getString(
      req.body?.osNameAndVersion || req.body?.osVersion,
    );
    const appVersion = inputSanitizer.getString(req.body?.appVersion);

    // Check params
    if (!deviceId) {
      logInfo(req.body?.userEmail, 'requestDeviceAccess2 fail: missing deviceId');
      return res.status(400).json({ error: 'missing_deviceId' });
    }
    if (!deviceName) {
      logInfo(req.body?.userEmail, 'requestDeviceAccess2 fail: missing deviceName');
      return res.status(400).json({ error: 'missing_deviceName' });
    }
    // if (!deviceType) {
    //   logInfo(req.body?.userEmail, 'requestDeviceAccess2 fail: missing deviceType');
    //   return res.status(400).json({ error: 'missing_deviceType' });
    // }
    if (!osNameAndVersion) {
      logInfo(req.body?.userEmail, 'requestDeviceAccess2 fail: missing osNameAndVersion');
      return res.status(400).json({ error: 'missing_osNameAndVersion' });
    }
    if (!devicePublicKey) {
      logInfo(req.body?.userEmail, 'requestDeviceAccess2 fail: missing devicePublicKey');
      return res.status(400).json({ error: 'missing_devicePublicKey' });
    }

    // Request DB
    let userRes = await db.query(
      `SELECT
        users.id AS id,
        users.deactivated AS deactivated,
        users.settings_override AS settings_override,
        groups.settings AS group_settings
      FROM users INNER JOIN groups ON groups.id = users.group_id
      WHERE users.email=$1 AND users.group_id=$2`,
      [userEmail, groupIds.internalId],
    );
    if (userRes.rows[0]?.deactivated) {
      return res.status(403).json({ error: 'user_deactivated' });
    }
    if (userRes.rowCount === 0) {
      // make sure email address is allowed
      const userMSEntraId = await MicrosoftGraph.getUserId(groupIds.internalId, userEmail);
      const emailAuthStatus = await getEmailAuthorizationStatus(
        userEmail,
        userMSEntraId,
        groupIds.internalId,
      );
      if (emailAuthStatus === 'UNAUTHORIZED') {
        logInfo(req.body?.userEmail, 'requestDeviceAccess2 fail: email address not allowed');
        return res.status(403).json({ error: 'email_address_not_allowed' });
      }
      userRes = await db.query(
        'INSERT INTO users (email, ms_entra_id, group_id) VALUES ($1,$2,$3) RETURNING id',
        [userEmail, userMSEntraId, groupIds.internalId],
      );
    }
    const userId = userRes.rows[0].id;

    // CHECK SECOND REQUESTS FOR SAME DEVICE
    const deviceRes = await db.query(
      'SELECT id, authorization_status, authorization_code, auth_code_expiration_date FROM user_devices WHERE user_id=$1 AND device_unique_id=$2 AND group_id=$3',
      [userId, deviceId, groupIds.internalId],
    );

    if (
      deviceRes.rowCount != null &&
      deviceRes.rowCount > 0 &&
      deviceRes.rows[0].authorization_status === 'AUTHORIZED'
    ) {
      logInfo(req.body?.userEmail, 'requestDeviceAccess2 OK (device already authorized)');
      return res.status(200).json({ authorizationStatus: 'AUTHORIZED' });
    } else if (
      deviceRes.rowCount != null &&
      deviceRes.rowCount > 0 &&
      deviceRes.rows[0].authorization_status === 'PENDING' &&
      !isExpired(deviceRes.rows[0].auth_code_expiration_date)
    ) {
      // resend email
      await sendDeviceRequestEmail(
        userEmail,
        deviceName,
        deviceType,
        osNameAndVersion,
        deviceRes.rows[0].authorization_code,
        deviceRes.rows[0].auth_code_expiration_date,
      );
      logInfo(req.body?.userEmail, 'requestDeviceAccess2 OK (email resent)');
      return res.status(200).json({ authorizationStatus: 'PENDING' });
    }

    const randomAuthorizationCode = getRandomString(8);
    const expirationDate = getExpirationDate();
    if (deviceRes.rowCount === 0) {
      // BEFORE CREATING THE REQUEST, CHECK SOME SECURITY SETTINGS
      const userAllowedOnPlatform = isAllowedOnPlatform(
        osFamily + osNameAndVersion + deviceType,
        userRes.rows[0].group_settings as GROUP_SETTINGS,
        userRes.rows[0].settings_override as USER_SETTINGS_OVERRIDE,
      );
      if (!userAllowedOnPlatform) {
        logInfo(
          req.body?.userEmail,
          `requestDeviceAccess2 KO (not allowed on platform ${osFamily})`,
        );
        return res.status(403).json({ error: 'os_not_allowed' });
      }

      await db.query(
        'INSERT INTO user_devices (user_id, device_name, device_type, install_type, os_family, os_version, app_version, device_unique_id, device_public_key_2, authorization_status, authorization_code, auth_code_expiration_date, group_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)',
        [
          userId,
          deviceName,
          deviceType,
          installType,
          osFamily,
          osNameAndVersion,
          appVersion,
          deviceId,
          devicePublicKey,
          'PENDING',
          randomAuthorizationCode,
          expirationDate,
          groupIds.internalId,
        ],
      );
    } else {
      // request is pending and expired, let's update it
      await db.query(
        'UPDATE user_devices SET (device_name, authorization_status, authorization_code, auth_code_expiration_date) = ($1,$2,$3,$4) WHERE user_id=$5 AND device_unique_id=$6 AND group_id=$7',
        [
          deviceName,
          'PENDING',
          randomAuthorizationCode,
          expirationDate,
          userId,
          deviceId,
          groupIds.internalId,
        ],
      );
    }

    await sendDeviceRequestEmail(
      userEmail,
      deviceName,
      deviceType,
      osNameAndVersion,
      randomAuthorizationCode,
      new Date(expirationDate),
    );

    logInfo(req.body?.userEmail, 'requestDeviceAccess2 OK (email sent with new code)');
    // Return res
    return res.status(200).json({ authorizationStatus: 'MAIL_SENT' });
  } catch (e) {
    logError(req.body?.userEmail, 'requestDeviceAccess', e);
    res.status(400).end();
  }
};
