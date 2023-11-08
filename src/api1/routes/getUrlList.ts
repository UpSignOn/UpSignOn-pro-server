import { checkBasicAuth } from '../helpers/authorizationChecks';
import { db } from '../../helpers/db';
import { logError } from '../../helpers/logger';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const getUrlList = async (req: any, res: any): Promise<void> => {
  try {
    const basicAuth = await checkBasicAuth(req);
    if (!basicAuth.granted) return res.status(401).end();

    const urlListRes = await db.query(
      'SELECT * FROM url_list WHERE group_id=$1 ORDER BY displayed_name ASC',
      [basicAuth.groupId],
    );

    // Return res
    return res.status(200).json({ urlList: urlListRes.rows });
  } catch (e) {
    logError(req.body?.userEmail, 'getUrlList', e);
    return res.status(400).end();
  }
};
