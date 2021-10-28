import { db } from '../helpers/connection';
import { logError } from '../helpers/logger';
import { checkBasicAuth } from '../helpers/authorizationChecks';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const checkEmailAddressForSharing = async (req: any, res: any) => {
  try {
    let emailAddress = req.body?.emailAddress;
    if (!emailAddress || typeof emailAddress !== 'string') return res.status(401).end();
    emailAddress = emailAddress.toLowerCase();

    const basicAuth = await checkBasicAuth(req);
    if (!basicAuth.granted) return res.status(401).end();

    const checkRes = await db.query(
      'SELECT sharing_public_key FROM users WHERE email=$1 AND sharing_public_key IS NOT NULL AND group_id=$2',
      [emailAddress, basicAuth.groupId],
    );
    // Return res
    return res
      .status(200)
      .json({ valid: checkRes.rowCount > 0, publicKey: checkRes.rows[0]?.sharing_public_key });
  } catch (e) {
    logError('checkEmailAddressForSharing', e);
    return res.status(400).end();
  }
};
