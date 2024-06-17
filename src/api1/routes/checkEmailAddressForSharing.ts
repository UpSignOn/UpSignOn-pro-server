import { db } from '../../helpers/db';
import { logError } from '../../helpers/logger';
import { PREVENT_V1_API_WHEN_V2_DATA, checkBasicAuth } from '../helpers/authorizationChecks';
import { inputSanitizer } from '../../helpers/sanitizer';
import { isStrictlyLowerVersion } from '../../helpers/appVersionChecker';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const checkEmailAddressForSharing = async (req: any, res: any) => {
  try {
    const emailAddress = inputSanitizer.getLowerCaseString(req.body?.emailAddress);
    if (!emailAddress) return res.status(401).end();

    const appVersion = inputSanitizer.getString(req.body?.appVersion);
    if (isStrictlyLowerVersion(appVersion, '7.1.1')) {
      return res.status(403).send({ error: 'deprecated_app' });
    }

    const basicAuth = await checkBasicAuth(req);
    if (!basicAuth.granted) return res.status(401).end();

    const hasDataV2Res = await db.query(
      'SELECT length(encrypted_data_2) AS data2_length FROM users WHERE id=$1',
      [basicAuth.userId],
    );
    if (PREVENT_V1_API_WHEN_V2_DATA && hasDataV2Res.rows[0].data2_length > 0) {
      return res.status(403).json({ error: 'deprecated_app' });
    }

    const checkRes = await db.query(
      'SELECT sharing_public_key FROM users WHERE email=$1 AND sharing_public_key IS NOT NULL AND group_id=$2',
      [emailAddress, basicAuth.groupId],
    );
    // Return res
    return res.status(200).json({
      valid: checkRes.rowCount != null ? checkRes.rowCount > 0 : false,
      publicKey: checkRes.rows[0]?.sharing_public_key,
    });
  } catch (e) {
    logError(req.body?.userEmail, 'checkEmailAddressForSharing', e);
    return res.status(400).end();
  }
};
