import { v4 as uuidv4 } from 'uuid';
import { db } from '../helpers/connection';
import { logError } from '../helpers/logger';
import { checkBasicAuth } from '../helpers/authorizationChecks';

let contactSearchSessions: { session: string; expirationTimestamp: number }[] = [];

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const getMatchingEmailAddressesForSharing = async (req: any, res: any) => {
  try {
    let emailAddressSearch = req.body?.emailAddressSearch;
    if (
      !emailAddressSearch ||
      typeof emailAddressSearch != 'string' ||
      emailAddressSearch.length < 3
    )
      return res.status(401).end();

    emailAddressSearch = emailAddressSearch.toLowerCase();

    // session mechanism for performance (this route will necessarily be called multiple times in a row, let's avoid unecessary db queries)
    let session = req.body?.session;
    contactSearchSessions = contactSearchSessions.filter((s) => s.expirationTimestamp < Date.now());
    const sessionDict = !!session ? contactSearchSessions.find((s) => s.session === session) : null;
    if (sessionDict != null) {
      sessionDict.expirationTimestamp += 10000;
    } else {
      session = uuidv4();
      contactSearchSessions.push({ session, expirationTimestamp: Date.now() + 10000 });

      const basicAuth = await checkBasicAuth(req);
      if (!basicAuth.granted) return res.status(401).end();
    }

    const searchRes = await db.query(
      'SELECT email FROM users WHERE email LIKE $1 AND sharing_public_key IS NOT NULL AND group_id=$2',
      [emailAddressSearch + '%', req.params.groupId],
    );
    // Return res
    return res.status(200).json({ emails: searchRes.rows.map((d) => d.email), session });
  } catch (e) {
    logError('getMatchingEmailAddressesForSharing', e);
    return res.status(400).end();
  }
};
