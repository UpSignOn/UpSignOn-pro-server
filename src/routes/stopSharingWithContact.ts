import { db } from '../helpers/db';
import { logError } from '../helpers/logger';
import { checkBasicAuth } from '../helpers/authorizationChecks';
import { inputSanitizer } from '../helpers/sanitizer';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const stopSharingWithContact = async (req: any, res: any): Promise<void> => {
  try {
    const contactId = inputSanitizer.getNumberOrNull(req.body?.contactId);
    const itemId = inputSanitizer.getNumberOrNull(req.body?.itemId);
    if (!contactId) return res.status(401).end();
    if (!itemId) return res.status(401).end();

    const basicAuth = await checkBasicAuth(req, { checkIsManagerForItemId: itemId });
    if (!basicAuth.granted) return res.status(401).end();

    // it is not authorized to remove oneself (to make sure there is always at least one contact for each item)
    if (basicAuth.userId === contactId) return res.status(401).end();

    const deleteRes = await db.query(
      'DELETE FROM shared_account_users WHERE shared_account_id=$1 AND user_id=$2 AND group_id=$3',
      [itemId, contactId, basicAuth.groupId],
    );

    if (deleteRes.rowCount !== 1) return res.status(400).end();

    return res.status(200).end();
  } catch (e) {
    logError('stopSharingWithContact', e);
    return res.status(400).end();
  }
};
