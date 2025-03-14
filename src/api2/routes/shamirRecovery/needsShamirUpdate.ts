import { db } from '../../../helpers/db';
import { logError, logInfo } from '../../../helpers/logger';
import { checkBasicAuth2 } from '../../helpers/authorizationChecks';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const needsShamirUpdate = async (req: any, res: any): Promise<void> => {
  try {
    const authRes = await checkBasicAuth2(req);
    if (!authRes.granted) {
      logInfo(req.body?.userEmail, 'needsShamirUpdate fail: auth not granted');
      return res.status(401).end();
    }

    // returns the number of shamir recipients that did not receive a share of the user's backup
    const dbRes = await db.query(
      `SELECT COUNT(*) as nb_missing_shares FROM shamir_configs AS sc
      INNER JOIN users AS u ON sc.group_id = u.group_id AND sc.user_level = u.shamir_level
      INNER JOIN shamir_recipients as sr ON sr.shamir_config_id=sc.id
      LEFT JOIN shamir_shares as ss ON ss.user_id=u.id AND ss.shamir_recipient_id=sr.id
      WHERE encrypted_share is NULL AND sc.is_active = true AND u.id=$1
      `,
      [authRes.userId],
    );
    return res.status(200).json({ needsShamirUpdate: dbRes.rows[0].nb_missing_shares > 0 });
  } catch (e) {
    logError(req.body?.userEmail, 'needsShamirUpdate', e);
    return res.status(400).end();
  }
};
