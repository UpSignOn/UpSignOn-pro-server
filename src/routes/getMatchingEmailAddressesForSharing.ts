import { v4 as uuidv4 } from 'uuid';
import { db } from '../helpers/connection';
import { accessCodeHash } from '../helpers/accessCodeHash';
import { logError } from '../helpers/logger';

let contactSearchSessions: { session: string; expirationTimestamp: number }[] = [];

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const getMatchingEmailAddressesForSharing = async (req: any, res: any) => {
  try {
    const emailAddressSearch = req.body?.emailAddressSearch;
    if (!emailAddressSearch || emailAddressSearch.length < 3) return res.status(401).end();

    // session mechanism for performance (this route will necessarily be called multiple times in a row, let's avoid unecessary db queries)
    let session = req.body?.session;
    contactSearchSessions = contactSearchSessions.filter((s) => s.expirationTimestamp < Date.now());
    const sessionDict = !!session ? contactSearchSessions.find((s) => s.session === session) : null;
    if (sessionDict != null) {
      sessionDict.expirationTimestamp += 10000;
    } else {
      session = uuidv4();
      contactSearchSessions.push({ session, expirationTimestamp: Date.now() + 10000 });

      // Get params
      let userEmail = req.body?.userEmail;
      if (!userEmail || typeof userEmail !== 'string') return res.status(401).end();
      userEmail = userEmail.toLowerCase();

      const deviceId = req.body?.deviceId;
      const deviceAccessCode = req.body?.deviceAccessCode;

      // Check params
      if (!deviceId) return res.status(401).end();
      if (!deviceAccessCode) return res.status(401).end();

      // Request DB
      const dbRes = await db.query(
        "SELECT users.id AS userid, user_devices.access_code_hash AS access_code_hash FROM user_devices INNER JOIN users ON user_devices.user_id = users.id WHERE users.email=$1 AND user_devices.device_unique_id = $2 AND user_devices.authorization_status='AUTHORIZED'",
        [userEmail, deviceId],
      );

      if (!dbRes || dbRes.rowCount === 0) return res.status(401).end();

      // Check access code
      const isAccessGranted = await accessCodeHash.asyncIsOk(
        deviceAccessCode,
        dbRes.rows[0].access_code_hash,
      );
      if (!isAccessGranted) return res.status(401).end();
    }

    const searchRes = await db.query(
      'SELECT email FROM users WHERE email LIKE $1 AND sharing_public_key IS NOT NULL',
      [emailAddressSearch + '%'],
    );
    // Return res
    return res.status(200).json({ emails: searchRes.rows.map((d) => d.email), session });
  } catch (e) {
    logError('getMatchingEmailAddressesForSharing', e);
    return res.status(400).end();
  }
};
