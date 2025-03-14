import { db } from '../../../helpers/db';
import { logError, logInfo } from '../../../helpers/logger';
import { checkBasicAuth2, checkDeviceAuthorizationOnly } from '../../helpers/authorizationChecks';
import { sendRecoveryRequestCompletedUserAlert } from './mailHelpers';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const finishShamirRecovery = async (req: any, res: any): Promise<void> => {
  try {
    const basicAuth = await checkBasicAuth2(req, { returningDeviceId: true });
    if (!basicAuth.granted) {
      logInfo(req.body?.userEmail, 'finishShamirRecovery fail: auth not granted');
      return res.status(401).end();
    }

    await db.query(
      `UPDATE shamir_recovery_requests SET status='COMPLETED', completed_at=current_timestamp(0) WHERE device_id=$1 AND status='PENDING'`,
      [basicAuth.deviceId],
    );
    await db.query('UPDATE shamir_shares SET encrypted_approved_share=null WHERE user_id=$1', [
      basicAuth.userId,
    ]);
    const deviceRes = await db.query('SELECT device_name FROM user_devices WHERE id=$1', [
      basicAuth.deviceId,
    ]);
    await sendRecoveryRequestCompletedUserAlert(basicAuth.userEmail, deviceRes.rows[0].device_name);
    return res.status(200).end();
  } catch (e) {
    logError(req.body?.userEmail, 'finishShamirRecovery', e);
    return res.status(400).end();
  }
};
