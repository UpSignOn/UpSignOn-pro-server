import { db } from '../../../helpers/db';
import { logError } from '../../../helpers/logger';
import { checkBasicAuth } from '../../helpers/authorizationChecks';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const getSharedVaultKeysToMigrate = async (req: any, res: any) => {
  try {
    const basicAuth = await checkBasicAuth(req);
    if (!basicAuth.granted) return res.status(401).end();

    const mySharedVaults = await db.query(
      'SELECT shared_vault_id, encrypted_shared_vault_key FROM shared_vault_recipients WHERE user_id=$1 AND group_id=$2',
      [basicAuth.userId, basicAuth.groupId],
    );
    // Return res
    return res.status(200).json({
      sharedVaultKeys: mySharedVaults.rows.map((sv) => {
        return {
          id: sv.shared_vault_id,
          encryptedAesKey: sv.encrypted_shared_vault_key,
        };
      }),
    });
  } catch (e) {
    logError('getSharedVaultKeysToMigrate', e);
    return res.status(400).end();
  }
};
