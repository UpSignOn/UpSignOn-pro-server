import { db } from '../../../helpers/db';
import { logError, logInfo } from '../../../helpers/logger';
import { checkBasicAuth2 } from '../../helpers/authorizationChecks';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const availableShamirConfigs = async (req: any, res: any): Promise<void> => {
  try {
    const authRes = await checkBasicAuth2(req);
    if (!authRes.granted) {
      logInfo(req.body?.userEmail, 'availableShamirConfigs fail: auth not granted');
      return res.status(401).end();
    }

    // add orders to easily compare configurations
    const shamirConfigsRes = await db.query(
      `WITH r AS (SELECT sr.id as id, sr.shamir_config_id, sr.user_id, u.email FROM shamir_recipients AS sr LEFT JOIN users AS u ON u.id=sr.user_id ORDER BY sr.id)
      SELECT
        sc.id as id,
        sc.name as name,
        sc.min_shares as min_shares,
        JSON_AGG(r.*) as recipients
      FROM shamir_configs AS sc
      INNER JOIN r ON r.shamir_config_id = sc.id
      INNER JOIN users AS u ON u.group_id=sc.group_id AND u.shamir_level=sc.user_level
      WHERE sc.is_active = true AND u.id=$1
      ORDER BY sc.id,
      `,
      [authRes.userId],
    );
    return res.status(200).json(shamirConfigsRes.rows);
  } catch (e) {
    logError(req.body?.userEmail, 'availableShamirConfigs', e);
    return res.status(400).end();
  }
};
