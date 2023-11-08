import { db } from '../../helpers/db';
import { logError } from '../../helpers/logger';
import { inputSanitizer } from '../../helpers/sanitizer';
import { checkBasicAuth } from '../helpers/authorizationChecks';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const updateSharingPubKey = async (req: any, res: any): Promise<void> => {
  try {
    const sharingPubKey = inputSanitizer.getString(req.body.pubKey);

    const basicAuth = await checkBasicAuth(req);
    if (!basicAuth.granted) return res.status(401).end();

    await db.query('UPDATE users SET sharing_public_key=$1 WHERE email=$2 AND group_id=$3', [
      sharingPubKey,
      basicAuth.userEmail,
      basicAuth.groupId,
    ]);

    return res.status(200).end();
  } catch (e) {
    logError(req.body?.userEmail, 'updateSharingPubKey', e);
    return res.status(400).end();
  }
};
