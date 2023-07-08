import { db } from '../../../helpers/db';
import { logError } from '../../../helpers/logger';
import { inputSanitizer } from '../../../helpers/sanitizer';
import { checkBasicAuth } from '../../helpers/authorizationChecks';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const migrateSharedVaultKeys = async (req: any, res: any) => {
  try {
    const basicAuth = await checkBasicAuth(req);
    if (!basicAuth.granted) return res.status(401).end();

    const newSharedVaultKeys = inputSanitizer.getAesKeyUpdates(req.body?.newSharedVaultKeys);
    if(!newSharedVaultKeys) {
      return res.status(403).end();
    }
    if (newSharedVaultKeys && Array.isArray(newSharedVaultKeys)) {
      for (let i = 0; i < newSharedVaultKeys.length; i++) {
        // Security: do not use foreach or map
        const sharedVaultId = newSharedVaultKeys[i].id;
        const encKey = newSharedVaultKeys[i].encryptedAesKey;
        await db.query(
          'UPDATE shared_vault_recipients SET encrypted_shared_vault_key=$1 WHERE shared_vault_id=$2 AND user_id=$3 AND group_id=$4',
          [encKey, sharedVaultId, basicAuth.userId, basicAuth.groupId],
        );
      }
    }
    return res.status(204).end();
  } catch (e) {
    logError('migrateSharedvaultKeys', e);
    return res.status(400).end();
  }
};
