import { db } from '../../../helpers/db';
import { logError } from '../../../helpers/logger';
import { checkBasicAuth2 } from '../../helpers/authorizationChecks';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const getUrlList2 = async (req: any, res: any): Promise<void> => {
  try {
    const basicAuth = await checkBasicAuth2(req);
    if (!basicAuth.granted) return res.status(401).end();

    const urlListRes = await db.query(
      'SELECT * FROM url_list WHERE group_id=$1 ORDER BY displayed_name ASC',
      [basicAuth.groupId],
    );

    const list = urlListRes.rows
      .filter((u) => !!u.displayed_name)
      .map((u) => ({
        name: u.displayed_name,
        url: u.signin_url,
        usesHTTPBasic: u.uses_basic_auth,
      }));

    // Return res
    return res.status(200).json({ urlList: list });
  } catch (e) {
    logError(req.body?.userEmail, 'getUrlList', e);
    return res.status(400).end();
  }
};
