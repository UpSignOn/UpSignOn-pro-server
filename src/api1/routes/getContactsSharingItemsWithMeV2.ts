import { db } from '../../helpers/db';
import { logError } from '../../helpers/logger';
import { checkBasicAuth } from '../../helpers/authorizationChecks';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const getContactsSharingItemsWithMeV2 = async (req: any, res: any) => {
  try {
    const basicAuth = await checkBasicAuth(req);
    if (!basicAuth.granted) return res.status(401).end();

    const contactsSharingItemsWithUser = await db.query(
      'SELECT DISTINCT u.email AS email, array_agg(sau.shared_account_id) AS shared_account_ids ' +
      'FROM users AS u INNER JOIN shared_account_users AS sau ON u.id=sau.user_id ' +
      'INNER JOIN shared_account_users AS sau2 ON sau.shared_account_id=sau2.shared_account_id ' +
      'INNER JOIN users AS u2 ON sau2.user_id = u2.id AND u2.email=$1 ' +
      'WHERE u.email != $1 ' +
      'AND u.group_id=$2 ' +
      'GROUP BY u.email',
      [basicAuth.userEmail, basicAuth.groupId],
    );
    // Return res
    return res.status(200).json({
      contacts: contactsSharingItemsWithUser.rows,
    });
  } catch (e) {
    logError('getContactsSharingItemsWithMe', e);
    return res.status(400).end();
  }
};
