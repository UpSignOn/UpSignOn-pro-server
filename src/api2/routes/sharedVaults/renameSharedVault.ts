import { db } from '../../../helpers/db';
import { logError } from '../../../helpers/logger';
import { inputSanitizer } from '../../../helpers/sanitizer';
import { checkBasicAuth2 } from '../../helpers/authorizationChecks';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const renameSharedVault = async (req: any, res: any): Promise<void> => {
  try {
    const sharedVaultId = inputSanitizer.getNumberOrNull(req.body?.sharedVaultId);
    if (sharedVaultId == null) return res.status(403).end();

    const newName = inputSanitizer.getString(req.body?.newName);
    if (!newName) return res.status(403).end();

    const authRes = await checkBasicAuth2(req, { checkIsManagerForVaultId: sharedVaultId });
    if (!authRes.granted) return res.status(401).end();

    const updateRes = await db.query(
      'UPDATE shared_vaults SET name=$1 WHERE id=$2 AND group_id=$3',
      [newName, sharedVaultId, authRes.groupId],
    );

    return res.status(204).end();
  } catch (e) {
    logError(req.body?.userEmail, 'renameSharedVault', e);
    return res.status(400).end();
  }
};
