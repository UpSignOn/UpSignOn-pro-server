import { db } from '../../helpers/db';
import { logError, logInfo } from '../../helpers/logger';
import { checkBasicAuth } from '../helpers/authorizationChecks';
import { inputSanitizer } from '../../helpers/sanitizer';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const checkUserPublicKey = async (req: any, res: any) => {
  try {
    const publicKey = inputSanitizer.getString(req.body?.publicKey);
    if (!publicKey) return res.status(403).end();

    const basicAuth = await checkBasicAuth(req, { returningUserPublicKey: true });
    if (!basicAuth.granted) return res.status(401).end();

    let matchingKeys = true;
    if (basicAuth.sharingPublicKey !== publicKey) {
      matchingKeys = false;
      const message = `---------------\nWARNING! POTENTIAL HACK DETECTED!\nThe public key for user ${basicAuth.userEmail} that was found in the database did not match the public key registered in the user's private space. The database public key was\n\n${basicAuth.sharingPublicKey}\n\nwhile the user's expected public key was\n\n${publicKey}\n\nA database request to update the public key for this user with his expected public key will be made right after this message.\nIt is possible that the hacker has been able to read the passwords of all the accounts that are shared with ${basicAuth.userEmail}.\n---------------`;
      logInfo(message);
      logError(message);
      await db.query('UPDATE users SET sharing_public_key = $1 WHERE email=$2 AND group_id=$3', [
        publicKey,
        basicAuth.userEmail,
        basicAuth.groupId,
      ]);
    }
    // Return res
    return res.status(200).json({ matchingKeys });
  } catch (e) {
    logError('checkUserPublicKey', e);
    return res.status(400).end();
  }
};
