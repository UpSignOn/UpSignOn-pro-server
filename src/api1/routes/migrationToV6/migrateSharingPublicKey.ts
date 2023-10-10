import { db } from '../../../helpers/db';
import { logError } from '../../../helpers/logger';
import { inputSanitizer } from '../../../helpers/sanitizer';
import { checkBasicAuth } from '../../helpers/authorizationChecks';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const migrateSharingPublicKey = async (req: any, res: any) => {
  try {
    const basicAuth = await checkBasicAuth(req);
    if (!basicAuth.granted) return res.status(401).end();

    const newSharingPublicKey = inputSanitizer.getString(req.body?.newSharingPublicKey);
    if (!newSharingPublicKey) {
      return res.status(403).end();
    }

    await db.query('UPDATE users SET sharing_public_key_2=$1 WHERE id=$2 AND group_id=$3', [
      newSharingPublicKey,
      basicAuth.userId,
      basicAuth.groupId,
    ]);
    return res.status(204).end();
  } catch (e) {
    logError('migrateSharingKey', e);
    return res.status(400).end();
  }
};
