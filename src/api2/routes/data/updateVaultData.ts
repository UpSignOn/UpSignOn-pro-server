import { db } from '../../../helpers/db';
import { logError, logInfo } from '../../../helpers/logger';
import { inputSanitizer } from '../../../helpers/sanitizer';
import { hashPasswordChallengeResultForSecureStorageV2 } from '../../helpers/passwordChallengev2';
import { checkBasicAuth2 } from '../../helpers/authorizationChecks';
import { isInstanceStopped } from '../../helpers/serverMoved';
import { IS_ACTIVE } from '../../../helpers/serverStatus';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const updateVaultData = async (req: any, res: any): Promise<void> => {
  try {
    if (!IS_ACTIVE) {
      return res.status(403);
    }
    const newEncryptedData = inputSanitizer.getString(req.body?.newEncryptedData);
    const lastUpdatedAt = inputSanitizer.getString(req.body?.lastUpdatedAt);

    // Check params
    if (!newEncryptedData) {
      logInfo(req.body?.userEmail, 'updateVaultData fail: missing newEncryptedData');
      return res.status(403).end();
    }
    if (!lastUpdatedAt) {
      logInfo(req.body?.userEmail, 'updateVaultData fail: missing lastUpdatedAt');
      return res.status(403).end();
    }

    const basicAuth = await checkBasicAuth2(req, { returningDeviceId: true });
    if (!basicAuth.granted) {
      logInfo(req.body?.userEmail, 'updateVaultData fail: auth not granted');
      return res.status(401).end();
    }
    const hasServerMoved = await isInstanceStopped(basicAuth.groupIds.internalId);
    if (hasServerMoved) {
      logInfo('instance stopped');
      return res.status(400).end();
    }

    const newEncryptedDataWithPasswordChallengeSecured =
      hashPasswordChallengeResultForSecureStorageV2(newEncryptedData);

    if (req.body?.vaultStats) {
      const vaultStats = inputSanitizer.getVaultStats(req.body?.vaultStats);
      const updateRes = await db.query(
        `UPDATE users
        SET (
          encrypted_data_2,
          updated_at,
          nb_accounts,
          nb_codes,
          nb_accounts_strong,
          nb_accounts_medium,
          nb_accounts_weak,
          nb_accounts_with_duplicated_password,
          nb_accounts_with_no_password,
          nb_accounts_red,
          nb_accounts_orange,
          nb_accounts_green
          )=(
            $1,
            CURRENT_TIMESTAMP(0),
            $5,$6,$7,$8,$9,$10,$11,$12,$13,$14
            )
            WHERE
            users.id=$2
            AND users.updated_at=CAST($3 AS TIMESTAMPTZ)
            AND users.group_id=$4
            RETURNING updated_at`,
        [
          newEncryptedDataWithPasswordChallengeSecured,
          basicAuth.userId,
          lastUpdatedAt,
          basicAuth.groupIds.internalId,
          vaultStats!.nbAccounts,
          vaultStats!.nbCodes,
          vaultStats!.nbAccountsStrong,
          vaultStats!.nbAccountsMedium,
          vaultStats!.nbAccountsWeak,
          vaultStats!.nbAccountsWithDuplicatedPassword,
          vaultStats!.nbAccountsWithNoPassword,
          vaultStats!.nbAccountsRed,
          vaultStats!.nbAccountsOrange,
          vaultStats!.nbAccountsGreen,
        ],
      );
      if (updateRes.rowCount === 0) {
        logInfo(req.body?.userEmail, 'updateVaultData fail: outdated data');
        // CONFLICT
        return res.status(409).json({ error: 'outdated' });
      }

      logInfo(req.body?.userEmail, 'updateVaultData OK');
      res.status(200).json({ lastUpdatedAt: updateRes.rows[0].updated_at });
    } else {
      const updateRes = await db.query(
        `UPDATE users
          SET (encrypted_data_2, updated_at)=($1,CURRENT_TIMESTAMP(0))
          WHERE
            users.email=$2
            AND users.updated_at=CAST($3 AS TIMESTAMPTZ)
            AND users.group_id=$4
            RETURNING updated_at`,
        [
          newEncryptedDataWithPasswordChallengeSecured,
          basicAuth.userEmail,
          lastUpdatedAt,
          basicAuth.groupIds.internalId,
        ],
      );
      if (updateRes.rowCount === 0) {
        logInfo(req.body?.userEmail, 'updateVaultData fail: outdated data');
        // CONFLICT
        return res.status(409).json({ error: 'outdated' });
      }
      logInfo(req.body?.userEmail, 'updateVaultData OK');
      res.status(200).json({ lastUpdatedAt: updateRes.rows[0].updated_at });
    }
    await db.query('UPDATE user_devices SET last_sync_date=$1 WHERE id=$2 AND group_id=$3', [
      new Date().toISOString(),
      basicAuth.deviceId,
      basicAuth.groupIds.internalId,
    ]);
  } catch (e) {
    logError(req.body?.userEmail, 'updateData2', e);
    return res.status(400).end();
  }
};
