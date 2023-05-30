import { db } from '../../../helpers/db';
import { logError } from '../../../helpers/logger';
import { inputSanitizer } from '../../../helpers/sanitizer';
import { checkBasicAuth2 } from '../../helpers/authorizationChecks';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const deleteSharedVault = async (req: any, res: any): Promise<void> => {
  try {
    const sharedVaultId = inputSanitizer.getNumberOrNull(req.body?.sharedVaultId);
    if (sharedVaultId == null) return res.status(403).end();

    const authRes = await checkBasicAuth2(req, { checkIsManagerForVaultId: sharedVaultId });
    if (!authRes.granted) return res.status(401).end();

    await db.query(
      'DELETE FROM shared_vaults WHERE id=$2 AND group_id=$2',
      [
        sharedVaultId,
        authRes.groupId,
      ],
    );

    return res.status(204);
  } catch (e) {
    logError('deleteSharedVault', e);
    return res.status(400).end();
  }
};
