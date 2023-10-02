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

    const vaultStats = inputSanitizer.getVaultStats(req.body?.vaultStats);
    if (!vaultStats) return res.status(403).end();

    const authRes = await checkBasicAuth2(req, { checkIsManagerForVaultId: sharedVaultId });
    if (!authRes.granted) return res.status(401).end();

    const contentDetails = inputSanitizer.getString(req.body?.contentDetails);

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
      // CONFLICT
      return res.status(409).json({ error: 'outdated' });
    }

    // also log stats in history:

    // remove previous stats this same day
    await db.query(
      "DELETE FROM data_stats WHERE shared_vault_id=$1 AND date_trunc('day', date)=date_trunc('day', now()) AND group_id=$2",
      [authRes.userId, authRes.groupId],
    );
    await db.query(
      'INSERT INTO data_stats (shared_vault_id, nb_accounts, nb_codes, nb_accounts_strong, nb_accounts_medium, nb_accounts_weak, nb_accounts_with_no_password, nb_accounts_with_duplicated_password, nb_accounts_red, nb_accounts_orange, nb_accounts_green, group_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)',
      [
        sharedVaultId,
        vaultStats!.nbAccounts,
        vaultStats!.nbCodes,
        vaultStats!.nbAccountsStrong,
        vaultStats!.nbAccountsMedium,
        vaultStats!.nbAccountsWeak,
        vaultStats!.nbAccountsWithNoPassword,
        vaultStats!.nbAccountsWithDuplicatedPassword,
        vaultStats!.nbAccountsRed,
        vaultStats!.nbAccountsOrange,
        vaultStats!.nbAccountsGreen,
        authRes.groupId,
      ],
    );

    return res.status(200).json({ lastUpdatedAt: updateRes.rows[0].last_updated_at });
  } catch (e) {
    logError('updateSharedVaultData', e);
    return res.status(400).end();
  }
};
