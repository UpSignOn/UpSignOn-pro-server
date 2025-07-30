import { v4 as uuidv4 } from 'uuid';
import { db } from '../../../helpers/db';
import { logError, logInfo } from '../../../helpers/logger';
import { inputSanitizer } from '../../../helpers/sanitizer';
import { checkBasicAuth2 } from '../../helpers/authorizationChecks';
import { getBankIds } from '../../helpers/bankUUID';

let contactSearchSessions: { session: string; expirationTimestamp: number }[] = [];

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const getMatchingEmailAddressesForSharing2 = async (req: any, res: any) => {
  try {
    const groupIds = await getBankIds(req);
    const emailAddressSearch = inputSanitizer.getString(req.body?.emailAddressSearch);
    if (!emailAddressSearch || emailAddressSearch.length < 3) {
      logInfo(
        req.body?.userEmail,
        'getMatchingEmailAddressesForSharing2 fail: search missing or too short',
      );
      return res.status(403).end();
    }

    let session = inputSanitizer.getString(req.body?.searchSession);
    contactSearchSessions = contactSearchSessions.filter((s) => s.expirationTimestamp < Date.now());
    const sessionDict = !!session ? contactSearchSessions.find((s) => s.session === session) : null;
    if (sessionDict != null) {
      sessionDict.expirationTimestamp += 10000;
    } else {
      const basicAuth = await checkBasicAuth2(req);
      if (!basicAuth.granted) {
        logInfo(req.body?.userEmail, 'getMatchingEmailAddressesForSharing2 fail: auth not granted');
        return res.status(401).end();
      }
      session = uuidv4();
      contactSearchSessions.push({ session, expirationTimestamp: Date.now() + 10000 });
    }

    const searchRes = await db.query(
      'SELECT email FROM users WHERE email LIKE $1 AND sharing_public_key_2 IS NOT NULL AND bank_id=$2',
      [emailAddressSearch + '%', groupIds.internalId],
    );
    logInfo(req.body?.userEmail, 'getMatchingEmailAddressesForSharing2 OK');
    // Return res
    return res
      .status(200)
      .json({ emails: searchRes.rows.map((d) => d.email), searchSession: session });
  } catch (e) {
    logError(req.body?.userEmail, 'getMatchingEmailAddressesForSharing2', e);
    return res.status(400).end();
  }
};
