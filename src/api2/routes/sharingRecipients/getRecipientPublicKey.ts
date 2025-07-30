import { db } from '../../../helpers/db';
import { logError, logInfo } from '../../../helpers/logger';
import { inputSanitizer } from '../../../helpers/sanitizer';
import { checkBasicAuth2 } from '../../helpers/authorizationChecks';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const getRecipientPublicKey = async (req: any, res: any) => {
  try {
    const emailAddress = inputSanitizer.getLowerCaseString(req.body?.emailAddress);
    if (!emailAddress) {
      logInfo(req.body?.userEmail, 'getRecipientPublicKey fail: emailAddress missing');
      return res.status(403).end();
    }

    const basicAuth = await checkBasicAuth2(req);
    if (!basicAuth.granted) {
      logInfo(req.body?.userEmail, 'getRecipientPublicKey fail: auth not granted');
      return res.status(401).end();
    }

    const checkRes = await db.query(
      'SELECT id, sharing_public_key_2 FROM users WHERE email=$1 AND sharing_public_key_2 IS NOT NULL AND bank_id=$2',
      [emailAddress, basicAuth.groupIds.internalId],
    );
    if (checkRes.rowCount == 0) {
      logInfo(req.body?.userEmail, 'getRecipientPublicKey fail: public key not found');
      return res.status(403).end();
    }
    logInfo(req.body?.userEmail, 'getRecipientPublicKey OK');
    // Return res
    return res
      .status(200)
      .json({ id: checkRes.rows[0]?.id, publicKey: checkRes.rows[0]?.sharing_public_key_2 });
  } catch (e) {
    logError(req.body?.userEmail, 'getRecipientPublicKey', e);
    return res.status(400).end();
  }
};
