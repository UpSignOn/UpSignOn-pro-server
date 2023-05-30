import { db } from '../../helpers/db';
import { logError } from '../../helpers/logger';
import { inputSanitizer } from '../../helpers/sanitizer';
import { checkBasicAuth2 } from '../helpers/authorizationChecks';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const getRecipientPublicKey = async (req: any, res: any) => {
  try {
    const emailAddress = inputSanitizer.getLowerCaseString(req.body?.emailAddress);
    if (!emailAddress) return res.status(403).end();

    const basicAuth = await checkBasicAuth2(req);
    if (!basicAuth.granted) return res.status(401).end();

    const checkRes = await db.query(
      'SELECT id, sharing_public_key FROM users WHERE email=$1 AND sharing_public_key IS NOT NULL AND group_id=$2',
      [emailAddress, basicAuth.groupId],
    );
    if (checkRes.rowCount == 0) {
      return res.status(403).end();
    }
    // Return res
    return res
      .status(200)
      .json({ id: checkRes.rows[0]?.id, publicKey: checkRes.rows[0]?.sharing_public_key });
  } catch (e) {
    logError('getRecipientPublicKey', e);
    return res.status(400).end();
  }
};
