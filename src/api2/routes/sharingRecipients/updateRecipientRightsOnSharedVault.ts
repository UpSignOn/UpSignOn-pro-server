import { db } from '../../../helpers/db';
import { logError, logInfo } from '../../../helpers/logger';
import { inputSanitizer } from '../../../helpers/sanitizer';
import { checkBasicAuth2 } from '../../helpers/authorizationChecks';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const updateRecipientRightsOnSharedVault = async (req: any, res: any) => {
  try {
    const sharedVaultId = inputSanitizer.getNumberOrNull(req.body?.sharedVaultId);
    if (sharedVaultId == null) {
      logInfo(
        req.body?.userEmail,
        'updateRecipientRightsOnSharedVault fail: missing sharedVaultId',
      );
      return res.status(403).end();
    }

    const recipientId = inputSanitizer.getNumberOrNull(req.body?.recipientId);
    if (recipientId == null) {
      logInfo(req.body?.userEmail, 'updateRecipientRightsOnSharedVault fail: recipientId was null');
      return res.status(403).end();
    }

    const willBeManager = inputSanitizer.getBoolean(req.body?.willBeManager);
    if (willBeManager == null) {
      logInfo(
        req.body?.userEmail,
        'updateRecipientRightsOnSharedVault fail: willBeManager was null',
      );
      return res.status(403).end();
    }

    const basicAuth = await checkBasicAuth2(req, { checkIsManagerForVaultId: sharedVaultId });
    if (!basicAuth.granted) {
      logInfo(req.body?.userEmail, 'updateRecipientRightsOnSharedVault fail: auth not granted');
      return res.status(401).end();
    }
    // Check we are not removing the last manager
    if (recipientId == basicAuth.userId) {
      const checkRes = await db.query(
        'SELECT count(*) AS count FROM shared_vault_recipients WHERE is_manager=true AND shared_vault_id=$1 AND group_id=$2',
        [sharedVaultId, basicAuth.groupId],
      );
      if (checkRes.rows[0].count == 1) {
        logInfo(req.body?.userEmail, 'updateRecipientRightsOnSharedVault fail: last_manager_error');
        return res.status(403).json({ error: 'last_manager_error' });
      }
    }

    await db.query(
      'UPDATE shared_vault_recipients SET is_manager=$1 WHERE shared_vault_id=$2 AND user_id=$3 AND group_id=$4',
      [willBeManager, sharedVaultId, recipientId, basicAuth.groupId],
    );
    logInfo(req.body?.userEmail, 'updateRecipientRightsOnSharedVault OK');
    return res.status(204).end();
  } catch (e) {
    logError(req.body?.userEmail, 'updateRecipientRightsOnSharedVault', e);
    return res.status(400).end();
  }
};
