import { db } from '../helpers/connection';
import { logError } from '../helpers/logger';
import { checkBasicAuth } from '../helpers/authorizationChecks';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const sendStats = async (req: any, res: any): Promise<void> => {
  try {
    const dataStats = req.body?.dataStats;
    if (!dataStats) return res.status(401).end();

    const basicAuth = await checkBasicAuth(req);
    if (!basicAuth.granted) return res.status(401).end();

    // remove previous stats this same day
    await db.query(
      "DELETE FROM data_stats WHERE user_id=$1 AND date_trunc('day', date)=date_trunc('day', now()) AND group_id=$2",
      [basicAuth.userId, basicAuth.groupId],
    );
    await db.query(
      'INSERT INTO data_stats (user_id, nb_accounts, nb_codes, nb_accounts_strong, nb_accounts_medium, nb_accounts_weak, nb_accounts_with_no_password, nb_accounts_with_duplicate_password, nb_accounts_red, nb_accounts_orange, nb_accounts_green, group_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)',
      [
        basicAuth.userId,
        dataStats.nbAccounts,
        dataStats.nbCodes,
        dataStats.nbAccountsWithStrongPassword,
        dataStats.nbAccountsWithMediumPassword,
        dataStats.nbAccountsWithWeakPassword,
        dataStats.nbAccountsWithoutPassword,
        dataStats.nbAccountsWithDuplicatePasswords,
        dataStats.nbAccountsRed,
        dataStats.nbAccountsOrange,
        dataStats.nbAccountsGreen,
        basicAuth.groupId,
      ],
    );

    return res.status(200).end();
  } catch (e) {
    logError('sendStats', e);
    return res.status(400).end();
  }
};
