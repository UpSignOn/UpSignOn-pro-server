import { db } from '../../../helpers/db';
import { logError } from '../../../helpers/logger';
import { checkDeviceAuthorizationOnly } from '../../helpers/authorizationChecks';
import { sendRecoveryRequestAbortedUserAlert } from './mailHelpers';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const abortShamirRecovery = async (req: any, res: any): Promise<void> => {
  try {
    const authRes = await checkDeviceAuthorizationOnly(res, req);
    if (authRes == null) {
      return;
    }

    const { user_id, device_primary_id } = authRes;

    await db.query(
      `UPDATE shamir_recovery_requests SET status='ABORTED' WHERE device_id=$1 AND status='PENDING'`,
      [device_primary_id],
    );
    await db.query('UPDATE shamir_shares SET encrypted_approved_share=null WHERE user_id=$1', [
      user_id,
    ]);
    const userRes = await db.query('SELECT email FROM users WHERE users.id=$1', [user_id]);
    const deviceRes = await db.query('SELECT device_name FROM user_devices WHERE id=$1', [
      device_primary_id,
    ]);
    await sendRecoveryRequestAbortedUserAlert(userRes.rows[0].email, deviceRes.rows[0].device_name);
    return res.status(200).end();
  } catch (e) {
    logError(req.body?.userEmail, 'abortShamirRecovery', e);
    return res.status(400).end();
  }
};
