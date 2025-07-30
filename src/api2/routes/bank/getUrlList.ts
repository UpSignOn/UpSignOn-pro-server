import { db } from '../../../helpers/db';
import { logError, logInfo } from '../../../helpers/logger';
import { checkBasicAuth2 } from '../../helpers/authorizationChecks';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const getUrlList2 = async (req: any, res: any): Promise<void> => {
  try {
    const basicAuth = await checkBasicAuth2(req);
    if (!basicAuth.granted) {
      logInfo(req.body?.userEmail, 'getUrlList2 fail: auth not granted');
      return res.status(401).end();
    }

    const urlListRes = await db.query(
      'SELECT * FROM url_list WHERE bank_id=$1 ORDER BY displayed_name ASC',
      [basicAuth.bankIds.internalId],
    );

    const list = urlListRes.rows
      .filter((u) => !!u.displayed_name)
      .map((u) => ({
        name: u.displayed_name,
        url: u.signin_url,
        usesHTTPBasic: u.uses_basic_auth,
      }));

    logInfo(req.body?.userEmail, 'getUrlList2 OK');
    // Return res
    return res.status(200).json({ urlList: list });
  } catch (e) {
    logError(req.body?.userEmail, 'getUrlList', e);
    return res.status(400).end();
  }
};
