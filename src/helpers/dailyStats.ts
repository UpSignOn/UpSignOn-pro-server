import { getNextMidnight } from './dateHelper';
import { db } from './db';
import { logError } from './logger';

export const aggregateStatsDaily = (): void => {
  performAggregateStats();

  // call perform sync everyday at 1pm and 1am
  const nextSyncDate = getNextMidnight();
  setTimeout(() => {
    performAggregateStats();
    setInterval(performAggregateStats, 24 * 3600 * 1000); // call it every 24 hours
  }, nextSyncDate.getTime() - Date.now()); // start the cron at the next midnight
};

const performAggregateStats = async (): Promise<void> => {
  try {
    // ADD stats from vaults
    await db.query(
      `INSERT INTO pwd_stats_evolution
        (date,
        group_id,
        nb_accounts,
        nb_codes,
        nb_accounts_strong,
        nb_accounts_medium,
        nb_accounts_weak,
        nb_accounts_with_duplicated_password,
        nb_accounts_with_no_password,
        nb_accounts_red,
        nb_accounts_orange,
        nb_accounts_green)
      SELECT
          date_trunc('day', CURRENT_TIMESTAMP(0)) - INTERVAL '1 second',
          group_id,
          SUM(nb_accounts),
          SUM(nb_codes),
          SUM(nb_accounts_strong),
          SUM(nb_accounts_medium),
          SUM(nb_accounts_weak),
          SUM(nb_accounts_with_duplicated_password),
          SUM(nb_accounts_with_no_password),
          SUM(nb_accounts_red),
          SUM(nb_accounts_orange),
          SUM(nb_accounts_green)
      FROM users
      GROUP BY group_id
      ON CONFLICT (date, group_id) DO UPDATE SET
        nb_accounts=EXCLUDED.nb_accounts,
        nb_codes=EXCLUDED.nb_codes,
        nb_accounts_strong=EXCLUDED.nb_accounts_strong,
        nb_accounts_medium=EXCLUDED.nb_accounts_medium,
        nb_accounts_weak=EXCLUDED.nb_accounts_weak,
        nb_accounts_with_duplicated_password=EXCLUDED.nb_accounts_with_duplicated_password,
        nb_accounts_with_no_password=EXCLUDED.nb_accounts_with_no_password,
        nb_accounts_red=EXCLUDED.nb_accounts_red,
        nb_accounts_orange=EXCLUDED.nb_accounts_orange,
        nb_accounts_green=EXCLUDED.nb_accounts_green`,
    );

    // ADD stats from shared vaults
    await db.query(
      `INSERT INTO pwd_stats_evolution
        (date,
        group_id,
        nb_accounts,
        nb_codes,
        nb_accounts_strong,
        nb_accounts_medium,
        nb_accounts_weak,
        nb_accounts_with_duplicated_password,
        nb_accounts_with_no_password,
        nb_accounts_red,
        nb_accounts_orange,
        nb_accounts_green)
      SELECT
          date_trunc('day', CURRENT_TIMESTAMP(0)) - INTERVAL '1 second',
          group_id,
          SUM(nb_accounts),
          SUM(nb_codes),
          SUM(nb_accounts_strong),
          SUM(nb_accounts_medium),
          SUM(nb_accounts_weak),
          SUM(nb_accounts_with_duplicated_password),
          SUM(nb_accounts_with_no_password),
          SUM(nb_accounts_red),
          SUM(nb_accounts_orange),
          SUM(nb_accounts_green)
      FROM shared_vaults
      GROUP BY group_id
      ON CONFLICT (date, group_id) DO UPDATE SET
        nb_accounts=pwd_stats_evolution.nb_accounts + EXCLUDED.nb_accounts,
        nb_codes=pwd_stats_evolution.nb_codes+EXCLUDED.nb_codes,
        nb_accounts_strong=pwd_stats_evolution.nb_accounts_strong+EXCLUDED.nb_accounts_strong,
        nb_accounts_medium=pwd_stats_evolution.nb_accounts_medium+EXCLUDED.nb_accounts_medium,
        nb_accounts_weak=pwd_stats_evolution.nb_accounts_weak+EXCLUDED.nb_accounts_weak,
        nb_accounts_with_duplicated_password=pwd_stats_evolution.nb_accounts_with_duplicated_password+EXCLUDED.nb_accounts_with_duplicated_password,
        nb_accounts_with_no_password=pwd_stats_evolution.nb_accounts_with_no_password+EXCLUDED.nb_accounts_with_no_password,
        nb_accounts_red=pwd_stats_evolution.nb_accounts_red+EXCLUDED.nb_accounts_red,
        nb_accounts_orange=pwd_stats_evolution.nb_accounts_orange+EXCLUDED.nb_accounts_orange,
        nb_accounts_green=pwd_stats_evolution.nb_accounts_green+EXCLUDED.nb_accounts_green`,
    );
  } catch (e) {
    logError('performAggregateStats', e);
  }
};
