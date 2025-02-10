import { db } from '../../../helpers/db';
import { logError, logInfo } from '../../../helpers/logger';
import { inputSanitizer } from '../../../helpers/sanitizer';
import { checkBasicAuth2 } from '../../helpers/authorizationChecks';
import { isInstanceStopped } from '../../helpers/serverMoved';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const updateSharedVaultData = async (req: any, res: any): Promise<void> => {
  try {
    const sharedVaultId = inputSanitizer.getNumberOrNull(req.body?.sharedVaultId);
    if (sharedVaultId == null) {
      logInfo(req.body?.userEmail, 'updateSharedVaultData fail: sharedVaultId was null');
      return res.status(403).end();
    }

    const newEncryptedData = inputSanitizer.getString(req.body?.newEncryptedData);
    if (!newEncryptedData) {
      logInfo(req.body?.userEmail, 'updateSharedVaultData fail: newEncryptedData was null');
      return res.status(403).end();
    }

    const lastUpdatedAt = inputSanitizer.getString(req.body?.lastUpdatedAt);
    if (!lastUpdatedAt) {
      logInfo(req.body?.userEmail, 'updateSharedVaultData fail: lastUpdatedAt was null');
      return res.status(403).end();
    }

    const vaultStats = inputSanitizer.getVaultStats(req.body?.vaultStats);
    if (!vaultStats) {
      logInfo(req.body?.userEmail, 'updateSharedVaultData fail: vaultStats was null');
      return res.status(403).end();
    }

    const authRes = await checkBasicAuth2(req, { checkIsEditorForVaultId: sharedVaultId });
    if (!authRes.granted) {
      logInfo(req.body?.userEmail, 'updateSharedVaultData fail: auth not granted');
      return res.status(401).end();
    }

    const hasServerMoved = await isInstanceStopped(authRes.groupId);
    if (hasServerMoved) {
      logInfo('instance stopped');
      return res.status(400).end();
    }

    const contentDetails = inputSanitizer.getSharedVaultDetails(req.body?.contentDetails);

    const updateRes = await db.query(
      `UPDATE shared_vaults
        SET (
          encrypted_data,
          last_updated_at,
          nb_accounts,
          nb_codes,
          nb_accounts_strong,
          nb_accounts_medium,
          nb_accounts_weak,
          nb_accounts_with_duplicated_password,
          nb_accounts_with_no_password,
          nb_accounts_red,
          nb_accounts_orange,
          nb_accounts_green,
          content_details
        )=(
          $1,
          CURRENT_TIMESTAMP(0),
          $5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15
        ) WHERE
          id=$2
          AND last_updated_at=CAST($3 AS TIMESTAMPTZ)
          AND group_id=$4
        RETURNING last_updated_at`,
      [
        newEncryptedData,
        sharedVaultId,
        lastUpdatedAt,
        authRes.groupId,
        vaultStats.nbAccounts,
        vaultStats.nbCodes,
        vaultStats.nbAccountsStrong,
        vaultStats.nbAccountsMedium,
        vaultStats.nbAccountsWeak,
        vaultStats.nbAccountsWithDuplicatedPassword,
        vaultStats.nbAccountsWithNoPassword,
        vaultStats.nbAccountsRed,
        vaultStats.nbAccountsOrange,
        vaultStats.nbAccountsGreen,
        contentDetails,
      ],
    );

    if (updateRes.rowCount === 0) {
      logInfo(req.body?.userEmail, 'updateSharedVaultData fail: outdated data');
      // CONFLICT
      return res.status(409).json({ error: 'outdated' });
    }

    logInfo(req.body?.userEmail, 'updateSharedVaultData OK');
    return res.status(200).json({ lastUpdatedAt: updateRes.rows[0].last_updated_at });
  } catch (e) {
    logError(req.body?.userEmail, 'updateSharedVaultData', e);
    return res.status(400).end();
  }
};
