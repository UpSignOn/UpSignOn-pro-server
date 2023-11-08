import { db } from '../../../helpers/db';
import { logError } from '../../../helpers/logger';
import { inputSanitizer } from '../../../helpers/sanitizer';
import { checkBasicAuth2 } from '../../helpers/authorizationChecks';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const getSharedVaultData = async (req: any, res: any): Promise<void> => {
  try {
    const sharedVaultId = inputSanitizer.getNumberOrNull(req.body?.sharedVaultId);
    if (sharedVaultId == null) return res.status(403).end();
    const authRes = await checkBasicAuth2(req, { checkIsRecipientForVaultId: sharedVaultId });
    if (!authRes.granted) return res.status(401).end();

    const sharedVaultRes = await db.query(
      `SELECT
        sv.id AS id,
        sv.name AS name,
        sv.encrypted_data AS encrypted_data,
        sv.last_updated_at AS last_updated_at,
        svr.is_manager AS is_manager,
        svr.encrypted_shared_vault_key AS encrypted_shared_vault_key
      FROM shared_vaults AS sv
      INNER JOIN shared_vault_recipients AS svr
      ON svr.shared_vault_id=sv.id
      WHERE svr.user_id=$1
      AND sv.id=$2
      AND sv.group_id=$3`,
      [authRes.userId, sharedVaultId, authRes.groupId],
    );
    const sharedVaultMap = sharedVaultRes.rows.map((s) => ({
      id: s.id,
      name: s.name,
      encryptedData: s.encrypted_data,
      lastUpdatedAt: s.last_updated_at,
      encryptedKey: s.encrypted_shared_vault_key,
      isManager: s.is_manager,
    }));
    return res.status(200).json({ sharedVault: sharedVaultMap[0] });
  } catch (e) {
    logError(req.body?.userEmail, 'getSharedVaultData', e);
    return res.status(400).end();
  }
};
