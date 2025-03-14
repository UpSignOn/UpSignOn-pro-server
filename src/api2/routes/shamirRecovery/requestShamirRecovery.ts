import { db } from '../../../helpers/db';
import { logError } from '../../../helpers/logger';
import { checkDeviceAuthorizationOnly } from '../../helpers/authorizationChecks';
import { findShamirConfigId, findShamirRecipientUniqueEmailsForTargetUserId } from './helpers';
import {
  sendRecoveryRequestRecipientNotification,
  sendRecoveryRequestUserAlert,
} from './mailHelpers';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const requestShamirRecovery = async (req: any, res: any): Promise<void> => {
  try {
    const authRes = await checkDeviceAuthorizationOnly(res, req);
    if (authRes == null) {
      return;
    }

    const { user_id, device_primary_id } = authRes;

    const configId = await findShamirConfigId(user_id);

    // abort if a previous procedure exists
    const previousRequestsRes = await db.query(
      `SELECT *
      FROM shamir_recovery_requests as srr
      INNER JOIN user_devices as ud ON ud.id=srr.device_id
      INNER JOIN users as u ON u.id = ud.user_id
      WHERE srr.status='PENDING' AND u.id=$1`,
      [user_id],
    );
    if (previousRequestsRes.rowCount != null && previousRequestsRes.rowCount > 0) {
      return res.status(403).json({ error: 'shamir_recovery_already_pending' });
    }
    await db.query(
      `INSERT INTO shamir_recovery_requests (shamir_config_id, device_id, status) VALUES ($1,$2, 'PENDING')
      `,
      [configId, device_primary_id],
    );
    const userRes = await db.query(
      'SELECT users.email, groups.name FROM users INNER JOIN groups ON users.group_id=users.group_id WHERE users.id=$1',
      [user_id],
    );
    const deviceRes = await db.query(
      'SELECT device_name, os_family, os_version, device_type FROM user_devices WHERE id=$1',
      [device_primary_id],
    );
    const uniqueAdminEmails = await findShamirRecipientUniqueEmailsForTargetUserId(user_id);
    await sendRecoveryRequestUserAlert(
      userRes.rows[0].email,
      userRes.rows[0].name,
      deviceRes.rows[0].device_name,
      deviceRes.rows[0].os_family,
      deviceRes.rows[0].os_version,
      deviceRes.rows[0].device_type,
    );
    await sendRecoveryRequestRecipientNotification(
      uniqueAdminEmails,
      userRes.rows[0].email,
      userRes.rows[0].name,
      deviceRes.rows[0].device_name,
      deviceRes.rows[0].os_family,
      deviceRes.rows[0].os_version,
      deviceRes.rows[0].device_type,
    );
    return res.status(200).end();
  } catch (e) {
    logError(req.body?.userEmail, 'requestShamirRecovery', e);
    return res.status(400).end();
  }
};
