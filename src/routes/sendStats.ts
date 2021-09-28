import { db } from '../helpers/connection';
import { accessCodeHash } from '../helpers/accessCodeHash';
import { logError } from '../helpers/logger';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const sendStats = async (req: any, res: any): Promise<void> => {
  try {
    // Get params
    let userEmail = req.body?.userEmail;
    if (!userEmail || typeof userEmail !== 'string') return res.status(401).end();
    userEmail = userEmail.toLowerCase();

    const deviceId = req.body?.deviceId;
    const deviceAccessCode = req.body?.deviceAccessCode;
    const dataStats = req.body?.dataStats;

    // Check params
    if (!deviceId) return res.status(401).end();
    if (!deviceAccessCode) return res.status(401).end();
    if (!dataStats) return res.status(401).end();

    // Request DB
    const dbRes = await db.query(
      `SELECT
        user_devices.access_code_hash AS access_code_hash,
        users.id AS user_id
      FROM user_devices
      INNER JOIN users ON user_devices.user_id = users.id
      WHERE users.email=$1 AND user_devices.device_unique_id = $2 AND user_devices.authorization_status='AUTHORIZED'`,
      [userEmail, deviceId],
    );

    if (!dbRes || dbRes.rowCount === 0) return res.status(404).end();

    // Check access code
    const isAccessGranted = await accessCodeHash.asyncIsOk(
      deviceAccessCode,
      dbRes.rows[0].access_code_hash,
    );
    if (!isAccessGranted) return res.status(401).end();

    // remove previous stats this same day
    await db.query(
      "DELETE FROM data_stats WHERE user_id=$1 AND date_trunc('day', date)=date_trunc('day', now())",
      [dbRes.rows[0].user_id],
    );
    await db.query(
      'INSERT INTO data_stats (user_id, nb_accounts, nb_codes, nb_accounts_strong, nb_accounts_medium, nb_accounts_weak, nb_accounts_with_duplicate_password) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      [
        dbRes.rows[0].user_id,
        dataStats.nbAccounts,
        dataStats.nbCodes,
        dataStats.nbAccountsWithStrongPassword,
        dataStats.nbAccountsWithMediumPassword,
        dataStats.nbAccountsWithWeakPassword,
        dataStats.nbAccountsWithDuplicatePasswords,
      ],
    );

    return res.status(200).end();
  } catch (e) {
    logError('sendStats', e);
    return res.status(400).end();
  }
};
