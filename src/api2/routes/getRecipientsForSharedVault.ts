import { db } from '../../helpers/db';
import { logError } from '../../helpers/logger';
import { inputSanitizer } from '../../helpers/sanitizer';
import { checkBasicAuth2 } from '../helpers/authorizationChecks';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const getRecipientsForSharedVault = async (req: any, res: any) => {
  try {
    const sharedVaultId = inputSanitizer.getNumberOrNull(req.body?.sharedVaultId);
    if (sharedVaultId == null) return res.status(403).end();

    const basicAuth = await checkBasicAuth2(req);
    if (!basicAuth.granted) return res.status(401).end();

    const dbRes = await db.query(
      'SELECT id, email, is_manager FROM shared_vault_recipients WHERE shared_vault_id=$1 AND group_id=$2',
      [sharedVaultId, basicAuth.groupId],
    );
    // Return res
    return res
      .status(200)
      .json({
        recipients: dbRes.rows.map(r => ({
          id: r.id,
          email: r.email,
          isManager: r.is_manager
        }))
      });
  } catch (e) {
    logError('getRecipientsForSharedVault', e);
    return res.status(400).end();
  }
};
