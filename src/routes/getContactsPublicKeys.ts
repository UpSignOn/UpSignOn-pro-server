import { db } from '../helpers/connection';
import { logError } from '../helpers/logger';
import { checkBasicAuth } from '../helpers/authorizationChecks';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const getContactsPublicKeys = async (req: any, res: any) => {
  try {
    const itemId = req.body?.itemId;
    if (!itemId) return res.status(401).end();

    const basicAuth = await checkBasicAuth(req, { checkIsManagerForItemId: itemId });
    if (!basicAuth.granted) return res.status(401).end();

    const contactRes = await db.query(
      'SELECT users.id, users.sharing_public_key FROM users INNER JOIN shared_account_users AS sau ON sau.user_id=users.id WHERE sau.shared_account_id = $1',
      [itemId],
    );
    // Return res
    return res.status(200).json({ contactsPublicKeys: contactRes.rows });
  } catch (e) {
    logError('getContactPublicKeys', e);
    return res.status(400).end();
  }
};
