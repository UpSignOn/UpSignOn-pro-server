import { db } from '../../../helpers/db';
import { logError } from '../../../helpers/logger';
import { inputSanitizer } from '../../../helpers/sanitizer';
import { checkBasicAuth2 } from '../../helpers/authorizationChecks';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const addRecipientToSharedVault = async (req: any, res: any): Promise<void> => {
  try {
    const sharedVaultId = inputSanitizer.getNumberOrNull(req.body?.sharedVaultId);
    if (sharedVaultId == null) return res.status(403).end();

    const encryptedSharedVaultKey = inputSanitizer.getString(req.body?.encryptedSharedVaultKey);
    if (!encryptedSharedVaultKey) return res.status(403).end();

    const recipientId = inputSanitizer.getNumberOrNull(req.body?.recipientId);
    if (recipientId == null) return res.status(403).end();

    const isManager = inputSanitizer.getBoolean(req.body?.isManager);

    const authRes = await checkBasicAuth2(req, { checkIsManagerForVaultId: sharedVaultId });
    if (!authRes.granted) return res.status(401).end();

    await db.query(
      'INSERT INTO shared_vault_recipients SET (shared_vault_id, user_id, encrypted_shared_vault_key, is_manager, group_id)=($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING',
      [
        sharedVaultId,
        recipientId,
        encryptedSharedVaultKey,
        isManager,
        authRes.groupId,
      ],
    );

    return res.status(204).json();
  } catch (e) {
    logError('addRecipientToSharedVault', e);
    return res.status(400).end();
  }
};
