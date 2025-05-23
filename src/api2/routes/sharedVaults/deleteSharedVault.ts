import { db } from '../../../helpers/db';
import { logError, logInfo } from '../../../helpers/logger';
import { inputSanitizer } from '../../../helpers/sanitizer';
import { checkBasicAuth2 } from '../../helpers/authorizationChecks';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const deleteSharedVault = async (req: any, res: any): Promise<void> => {
  try {
    const sharedVaultId = inputSanitizer.getNumberOrNull(req.body?.sharedVaultId);
    if (sharedVaultId == null) {
      logInfo(req.body?.userEmail, 'deleteSharedVault fail: missing sharedVaultId');
      return res.status(403).end();
    }

    const authRes = await checkBasicAuth2(req, { checkIsOwnerForVaultId: sharedVaultId });
    if (!authRes.granted) {
      logInfo(req.body?.userEmail, 'deleteSharedVault fail: auth not granted');
      return res.status(401).end();
    }

    await db.query('DELETE FROM shared_vaults WHERE id=$1 AND group_id=$2', [
      sharedVaultId,
      authRes.groupIds.internalId,
    ]);

    logInfo(req.body?.userEmail, `deleteSharedVault ${sharedVaultId} OK`);
    return res.status(204).end();
  } catch (e) {
    logError(req.body?.userEmail, 'deleteSharedVault', e);
    return res.status(400).end();
  }
};
