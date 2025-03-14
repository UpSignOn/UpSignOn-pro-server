import { db } from '../../../helpers/db';
import { logError } from '../../../helpers/logger';
import { checkDeviceAuthorizationOnly } from '../../helpers/authorizationChecks';
import { findShamirConfigId } from './helpers';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const retrieveShamirRecovery = async (req: any, res: any): Promise<void> => {
  try {
    const authRes = await checkDeviceAuthorizationOnly(res, req);
    if (authRes == null) {
      return;
    }

    const { user_id, device_primary_id } = authRes;
    const configId = findShamirConfigId(user_id);

    const checkRecoveryRequestRes = await db.query(
      `SELECT * FROM shamir_recovery_requests WHERE status='PENDING', device_id=$1`,
      [device_primary_id],
    );
    if (checkRecoveryRequestRes.rowCount == 0) {
      return res.status(401).json({ error: 'no_pending_recovery_request' });
    }

    const checkConfigRes = await db.query('SELECT min_shares FROM shamir_configs WHERE id=$1', [
      configId,
    ]);
    const minShares = checkConfigRes.rows[0].min_shares;
    const sharesRes = await db.query(
      'SELECT encrypted_approved_share FROM shamir_shares WHERE user_id=$1 AND encrypted_approved_share IS NOT NULL',
      [user_id],
    );
    if (sharesRes.rowCount == null || sharesRes.rowCount < minShares) {
      return res.status(204).json({ missing_shares: minShares - (sharesRes.rowCount || 0) });
    }
    return res
      .status(204)
      .json({ encryptedShares: sharesRes.rows.map((s) => s.encrypted_approved_share) });
  } catch (e) {
    logError(req.body?.userEmail, 'retrieveShamirRecovery', e);
    return res.status(400).end();
  }
};
