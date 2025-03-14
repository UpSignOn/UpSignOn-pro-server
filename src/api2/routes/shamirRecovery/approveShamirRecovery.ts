import { db } from '../../../helpers/db';
import { logError, logInfo } from '../../../helpers/logger';
import { inputSanitizer } from '../../../helpers/sanitizer';
import { checkBasicAuth2 } from '../../helpers/authorizationChecks';
import {
  findShamirConfigId,
  findShamirRecipientIdForConfig,
  isShamirRecoveryReady,
} from './helpers';
import { sendRecoveryRequestReadyUserAlert } from './mailHelpers';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const approveShamirRecovery = async (req: any, res: any): Promise<void> => {
  try {
    const targetUserId = inputSanitizer.getNumberOrNull(req.body?.targetUserId);
    const encryptedApprovedShare = inputSanitizer.getNumberOrNull(req.body?.encryptedApprovedShare);

    if (targetUserId == null || encryptedApprovedShare == null) {
      return res.status(403).end();
    }

    const basicAuth = await checkBasicAuth2(req, { returningDeviceId: true });
    if (!basicAuth.granted) {
      logInfo(req.body?.userEmail, 'approveShamirRecovery fail: auth not granted');
      return res.status(401).end();
    }

    const configId = await findShamirConfigId(targetUserId);
    if (configId == null) {
      return res.status(403).json({ error: 'no_shamir_config' });
    }
    const verifyRecoveryRequests = await db.query(
      "SELECT device_id FROM shamir_recovery_requests WHERE shamir_config_id=$1 AND device_id=$2 AND status='PENDING'",
      [configId, basicAuth.deviceId],
    );
    if (
      verifyRecoveryRequests.rowCount == null ||
      verifyRecoveryRequests.rowCount == 0 ||
      verifyRecoveryRequests.rows[0].status != 'PENDING'
    ) {
      return res.status(403).json({ error: 'no_pending_recovery_request' });
    }
    const recipientId = await findShamirRecipientIdForConfig(basicAuth.userId, configId);
    await db.query(
      `UPDATE shamir_shares
      SET encrypted_approved_share=$1, updated_at=current_timestamp(0)
      WHERE user_id=$2 AND shamir_recipient_id=$3
      `,
      [encryptedApprovedShare, targetUserId, recipientId],
    );

    // send an email to the user if enough shares have been granted
    const isReady = await isShamirRecoveryReady(configId, targetUserId);
    if (isReady) {
      const userRes = await db.query('SELECT email FROM users WHERE users.id=$1', [targetUserId]);
      const deviceRes = await db.query('SELECT device_name FROM user_devices WHERE id=$1', [
        verifyRecoveryRequests.rows[0].device_id,
      ]);
      await sendRecoveryRequestReadyUserAlert(userRes.rows[0].email, deviceRes.rows[0].device_name);
    }
    return res.status(200).end();
  } catch (e) {
    logError(req.body?.userEmail, 'approveShamirRecovery', e);
    return res.status(400).end();
  }
};
