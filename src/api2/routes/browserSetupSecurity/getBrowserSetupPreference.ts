import { db } from '../../../helpers/db';
import { logError, logInfo } from '../../../helpers/logger';
import { inputSanitizer } from '../../../helpers/sanitizer';
import { getBankIds } from '../../helpers/bankUUID';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const getBrowserSetupPreference = async (req: any, res: any) => {
  try {
    const bankIds = await getBankIds(req);

    // Get params
    const userEmail = inputSanitizer.getLowerCaseString(req.body?.userEmail);
    const deviceId = inputSanitizer.getString(req.body?.deviceId);

    // Check params
    if (!userEmail) {
      logInfo(req.body?.userEmail, 'getBrowserSetupPreference fail: missing userEmail');
      return res.status(403).end();
    }
    if (!deviceId) {
      logInfo(req.body?.userEmail, 'getBrowserSetupPreference fail: missing deviceId');
      return res.status(403).end();
    }

    // Request DB
    const dbRes = await db.query(
      `SELECT
        ud.use_safe_browser_setup AS user_use_safe_browser_setup,
        users.settings_override AS user_settings_override,
        banks.settings AS bank_settings
      FROM user_devices AS ud
      INNER JOIN users ON users.id = ud.user_id
      INNER JOIN banks ON users.bank_id = banks.id
      WHERE users.email=$1
          AND ud.device_unique_id = $2
          AND ud.authorization_status != 'REVOKED_BY_ADMIN'
          AND ud.authorization_status != 'REVOKED_BY_USER'
          AND users.bank_id=$3
      `,
      [userEmail, deviceId, bankIds.internalId],
    );

    const adminUseUnsafeBrowserSetup = true; // deprecated
    let userUseSafeBrowserSetup = false;
    let adminForceSafeBrowserSetup = false;

    if (dbRes.rowCount === 1) {
      const d = dbRes.rows[0];
      if (d.user_use_safe_browser_setup) {
        // user did force the use of the safe browser setup protocol
        userUseSafeBrowserSetup = true;
      }
      if (
        d.user_settings_override?.FORCE_SAFE_BROWSER_SETUP === true ||
        d.user_settings_override?.FORCE_SAFE_BROWSER_SETUP === false
      ) {
        // forced specifically for this user
        adminForceSafeBrowserSetup = !!d.user_settings_override?.FORCE_SAFE_BROWSER_SETUP;
      } else {
        adminForceSafeBrowserSetup = !!d.bank_settings?.FORCE_SAFE_BROWSER_SETUP;
      }
    }

    return res
      .status(200)
      .json({ adminUseUnsafeBrowserSetup, userUseSafeBrowserSetup, adminForceSafeBrowserSetup });
  } catch (e) {
    logError(req.body?.userEmail, 'getBrowserSetupPreference', e);
    return res.status(400).end();
  }
};
