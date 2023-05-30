import { db } from '../../../helpers/db';
import { logError } from '../../../helpers/logger';
import { inputSanitizer } from '../../../helpers/sanitizer';
import { checkBasicAuth2 } from '../../helpers/authorizationChecks';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const updateSharedVaultData = async (req: any, res: any): Promise<void> => {
  try {
    const sharedVaultId = inputSanitizer.getNumberOrNull(req.body?.sharedVaultId);
    if (sharedVaultId == null) return res.status(403).end();

    const newEncryptedData = inputSanitizer.getString(req.body?.newEncryptedData);
    if (!newEncryptedData) return res.status(403).end();

    const lastUpdatedAt = inputSanitizer.getString(req.body?.lastUpdatedAt);
    if (!lastUpdatedAt) return res.status(403).end();

    const authRes = await checkBasicAuth2(req, { checkIsManagerForVaultId: sharedVaultId });
    if (!authRes.granted) return res.status(401).end();

    const updateRes = await db.query(
      'UPDATE shared_vaults SET (encrypted_data, last_updated_at)=($1, CURRENT_TIMESTAMP(0)) WHERE id=$2 AND updated_at=CAST($3 AS TIMESTAMPTZ) AND group_id=$4 RETURNING last_updated_at',
      [
        newEncryptedData,
        sharedVaultId,
        lastUpdatedAt,
        authRes.groupId,
      ],
    );
    if (updateRes.rowCount === 0) {
      // CONFLICT
      return res.status(409).json({ error: "outdated" });
    }

    return res.status(200).json({ lastUpdatedAt: updateRes.rows[0].last_updated_at });
  } catch (e) {
    logError('updateSharedVaultData', e);
    return res.status(400).end();
  }
};
