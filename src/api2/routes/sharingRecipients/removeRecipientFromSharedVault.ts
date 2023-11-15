import { db } from '../../../helpers/db';
import { logError, logInfo } from '../../../helpers/logger';
import { inputSanitizer } from '../../../helpers/sanitizer';
import { checkBasicAuth2 } from '../../helpers/authorizationChecks';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const removeRecipientFromSharedVault = async (req: any, res: any) => {
  try {
    const sharedVaultId = inputSanitizer.getNumberOrNull(req.body?.sharedVaultId);
    if (sharedVaultId == null) {
      logInfo(req.body?.userEmail, 'removeRecipientFromSharedVault fail: missing sharedVaultId');
      return res.status(403).end();
    }

    const recipientId = inputSanitizer.getNumberOrNull(req.body?.recipientId);
    if (recipientId == null) {
      logInfo(req.body?.userEmail, 'removeRecipientFromSharedVault fail: missing recipientId');
      return res.status(403).end();
    }

    const basicAuth = await checkBasicAuth2(req, { checkIsManagerForVaultId: sharedVaultId });
    if (!basicAuth.granted) {
      logInfo(req.body?.userEmail, 'removeRecipientFromSharedVault fail: auth not granted');
      return res.status(401).end();
    }

    await db.query(
      'DELETE FROM shared_vault_recipients WHERE shared_vault_id=$1 AND user_id=$2 AND group_id=$3',
      [sharedVaultId, recipientId, basicAuth.groupId],
    );
    logInfo(req.body?.userEmail, 'removeRecipientFromSharedVault OK');
    return res.status(204).end();
  } catch (e) {
    logError(req.body?.userEmail, 'removeRecipientFromSharedVault', e);
    return res.status(400).end();
  }
};
