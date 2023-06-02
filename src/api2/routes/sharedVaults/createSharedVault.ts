import { db } from '../../../helpers/db';
import { logError } from '../../../helpers/logger';
import { inputSanitizer } from '../../../helpers/sanitizer';
import { checkBasicAuth2 } from '../../helpers/authorizationChecks';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const createSharedVault = async (req: any, res: any): Promise<void> => {
  try {
    const name = inputSanitizer.getString(req.body?.sharedVaultName);
    const encryptedData = inputSanitizer.getString(req.body?.encryptedData);
    const encryptedSharedVaultKey = inputSanitizer.getString(req.body?.encryptedSharedVaultKey);

    // 0 - Check params
    if (!encryptedData || !name)
      return res.status(403).end();

    const authRes = await checkBasicAuth2(req);
    if (!authRes.granted) return res.status(401).end();

    const creationRes = await db.query(`INSERT INTO shared_vaults
      (group_id, name, encrypted_data)
      VALUES ($1,$2,$3)
      RETURNING id, last_updated_at
    `, [authRes.groupId, name, encryptedData]);

    await db.query(`INSERT INTO shared_vault_recipients
    (group_id, shared_vault_id, user_id, encrypted_shared_vault_key, is_manager)
    VALUES ($1, $2, $3, $4, true)
    `, [authRes.groupId, creationRes.rows[0].id, authRes.userId, encryptedSharedVaultKey]);

    return res.status(200).json({ lastUpdatedAt: creationRes.rows[0].last_updated_at, sharedVaultId: creationRes.rows[0].id });
  } catch (e) {
    logError('createSharedVault', e);
    return res.status(400).end();
  }
};
