import { db } from '../../../helpers/db';
import { logError, logInfo } from '../../../helpers/logger';
import { inputSanitizer } from '../../../helpers/sanitizer';
import { checkBasicAuth2 } from '../../helpers/authorizationChecks';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const setBrowserSetupUserPreference = async (req: any, res: any) => {
  try {
    const basicAuth = await checkBasicAuth2(req, { returningDeviceId: true });
    if (!basicAuth.granted) {
      logInfo(req.body?.userEmail, 'setBrowserSetupUserPreference fail: auth not granted');
      return res.status(401).end();
    }
    const forceUseSafeBrowserSetup = inputSanitizer.getBoolean(req.body?.forceUseSafeBrowserSetup);

    // Request DB
    await db.query(
      `UPDATE user_devices
      SET use_safe_browser_setup=$1
      WHERE user_id=$2 AND device_unique_id=$3 AND group_id=$4
      `,
      [
        forceUseSafeBrowserSetup,
        basicAuth.userId,
        basicAuth.deviceUId,
        basicAuth.groupIds.internalId,
      ],
    );

    return res.status(200).end();
  } catch (e) {
    logError(req.body?.userEmail, 'setUserBrowserSetupPreference', e);
    return res.status(400).end();
  }
};
