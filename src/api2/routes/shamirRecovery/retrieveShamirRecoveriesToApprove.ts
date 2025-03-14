import { db } from '../../../helpers/db';
import { logError, logInfo } from '../../../helpers/logger';
import { checkBasicAuth2 } from '../../helpers/authorizationChecks';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const retrieveShamirRecoveriesToApprove = async (req: any, res: any): Promise<void> => {
  try {
    const basicAuth = await checkBasicAuth2(req, { returningDeviceId: true });
    if (!basicAuth.granted) {
      logInfo(req.body?.userEmail, 'retrieveShamirRecoveriesToApprove fail: auth not granted');
      return res.status(401).end();
    }

    const pendingRecoveryRequestsRes = await db.query(
      `SELECT
        ss.user_id AS target_user_id,
        u.email AS email,
        ss.encrypted_share AS encrypted_share,
        ud.device_public_key_2 AS device_public_key,
        srr.created_at AS requested_at,
        sc.name AS shamir_config_name
      FROM shamir_recovery_requests AS srr
      INNER JOIN user_devices AS ud ON ud.id = srr.device_id
      INNER JOIN shamir_shares AS ss ON ss.user_id = ud.user_id
      INNER JOIN shamir_recipients AS sr ON sr.id = ss.shamir_recipient_id
      INNER JOIN users AS u ON u.id = ud.user_id
      INNER JOIN shamir_configs AS sc ON sc.id = srr.shamir_config_id
      WHERE
        srr.status='PENDING' AND
        ud.authorization_status = 'AUTHORIZED' AND
        sr.user_id = $1
      `,
      [basicAuth.userId],
    );

    return res.status(204).json({ pendingRecoveryRequests: pendingRecoveryRequestsRes.rows });
  } catch (e) {
    logError(req.body?.userEmail, 'retrieveShamirRecoveriesToApprove', e);
    return res.status(400).end();
  }
};
