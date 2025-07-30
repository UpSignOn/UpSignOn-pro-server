import { db } from '../../../helpers/db';
import { logError, logInfo } from '../../../helpers/logger';
import { inputSanitizer } from '../../../helpers/sanitizer';
import { checkBasicAuth2 } from '../../helpers/authorizationChecks';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const getRecipientsForSharedVault = async (req: any, res: any) => {
  try {
    const sharedVaultId = inputSanitizer.getNumberOrNull(req.body?.sharedVaultId);
    if (sharedVaultId == null) {
      logInfo(req.body?.userEmail, 'getRecipientsForSharedVault fail: sharedVaultId missing');
      return res.status(403).end();
    }

    const basicAuth = await checkBasicAuth2(req);
    if (!basicAuth.granted) {
      logInfo(req.body?.userEmail, 'getRecipientsForSharedVault fail: auth not granted');
      return res.status(401).end();
    }

    const dbRes = await db.query(
      `SELECT svr.user_id, users.email, svr.is_manager, svr.access_level
          FROM shared_vault_recipients AS svr
          INNER JOIN users ON users.id=svr.user_id
          WHERE shared_vault_id=$1 AND svr.bank_id=$2`,
      [sharedVaultId, basicAuth.bankIds.internalId],
    );
    logInfo(req.body?.userEmail, 'getRecipientsForSharedVault OK');
    // Return res
    return res.status(200).json({
      recipients: dbRes.rows.map((r) => ({
        id: r.user_id,
        email: r.email,
        isManager: r.is_manager, // deprecated
        accessLevel: r.access_level,
      })),
    });
  } catch (e) {
    logError(req.body?.userEmail, 'getRecipientsForSharedVault', e);
    return res.status(400).end();
  }
};
