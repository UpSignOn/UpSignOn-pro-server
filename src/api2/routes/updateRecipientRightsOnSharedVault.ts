import { db } from '../../helpers/db';
import { logError } from '../../helpers/logger';
import { inputSanitizer } from '../../helpers/sanitizer';
import { checkBasicAuth2 } from '../helpers/authorizationChecks';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const updateRecipientRightsOnSharedVault = async (req: any, res: any) => {
  try {
    const sharedVaultId = inputSanitizer.getNumberOrNull(req.body?.sharedVaultId);
    if (sharedVaultId == null) return res.status(403).end();

    const recipientId = inputSanitizer.getNumberOrNull(req.body?.recipientId);
    if (recipientId == null) return res.status(403).end();

    const willBeManager = inputSanitizer.getBoolean(req.body?.willBeManager);
    if (willBeManager == null) return res.status(403).end();



    const basicAuth = await checkBasicAuth2(req, { checkIsManagerForVaultId: sharedVaultId });
    if (!basicAuth.granted) return res.status(401).end();

    const dbRes = await db.query(
      'UPDATE shared_vault_recipients SET is_manager=$1 WHERE shared_vault_id=$2 AND user_id=$3 AND group_id=$4',
      [willBeManager, sharedVaultId, recipientId, basicAuth.groupId],
    );
    return res.status(204).end();
  } catch (e) {
    logError('updateRecipientRightsOnSharedVault', e);
    return res.status(400).end();
  }
};
