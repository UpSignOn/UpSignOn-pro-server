import env from './env';
import { db } from './connection';
import childProcess from 'child_process';
import https from 'https';

export const sendStatusUpdate = async (): Promise<void> => {
  try {
    if (!env.IS_PRODUCTION) return;
    let gitCommit = 'unknown';
    try {
      gitCommit = childProcess.execSync('git rev-parse HEAD').toString().trim();
    } catch {}
    const lastMigrationResult = await db.query(
      'SELECT name FROM migrations ORDER BY name desc limit 1',
    );
    const lastMigration = lastMigrationResult.rows[0].name;
    const licenseCountResult = await db.query('SELECT COUNT(*) FROM users');
    const licenseCount = licenseCountResult.rows[0].count;
    const userAppVersionsResult = await db.query('SELECT DISTINCT(app_version) FROM user_devices');
    const userAppVersions = userAppVersionsResult.rows.map((v) => v.app_version);
    const stats = await getStats();
    const serverStatus = {
      displayName: env.ORGANISATION_NAME,
      serverUrl: env.API_PUBLIC_HOSTNAME,
      gitCommit,
      lastMigration,
      licenseCount,
      userAppVersions,
      securityGraph: stats,
    };

    sendToUpSignOn(serverStatus);
  } catch (e) {
    console.error(e);
  }
};

// NB use ISO string dates because they can be compared alphabetically
const getDaysArray = (startDay: string, endDay: string): string[] => {
  const current = new Date(startDay);
  current.setHours(0, 0, 0, 0); // make sur time date is set in ISO standard
  const end = new Date(endDay);
  const res = [];
  let hasNextDate = true;
  while (hasNextDate) {
    res.push(current.toISOString());
    current.setDate(current.getDate() + 1);
    hasNextDate = current.getTime() < end.getTime();
  }
  return res;
};

const getStats = async () => {
  // Clean data_stats to make there is at most one line per user per day
  await db.query(
    "DELETE FROM data_stats as ds1 USING data_stats as ds2 WHERE ds1.user_id=ds2.user_id AND date_trunc('day',ds1.date)=date_trunc('day', ds2.date) AND ds1.date<ds2.date;",
  );
  const rawStats = await db.query(
    "SELECT user_id, date_trunc('day', date) as day, nb_accounts, nb_codes, nb_accounts_strong, nb_accounts_medium, nb_accounts_weak, nb_accounts_with_no_password, nb_accounts_with_duplicate_password, nb_accounts_red, nb_accounts_orange, nb_accounts_green FROM data_stats ORDER BY day ASC",
  );

  if (rawStats.rowCount === 0) {
    return [];
  }

  /*
   * First get chartDataPerUserPerDay = {
   *  [userId]: {
   *    [day]: stats
   *  }
   * }
   */
  const chartDataPerUserPerDay: any = {};
  rawStats.rows.forEach((r) => {
    if (!chartDataPerUserPerDay[r.user_id]) {
      chartDataPerUserPerDay[r.user_id] = {};
    }
    chartDataPerUserPerDay[r.user_id][r.day.toISOString()] = r;
  });

  // Then get the continuous list of days
  const startDay = rawStats.rows[0].day;
  let endDay = rawStats.rows[rawStats.rowCount - 1].day;
  endDay = new Date(endDay);
  endDay.setDate(endDay.getDate() + 1);
  endDay.setHours(0, 0, 0, 0);
  endDay = endDay.toISOString();
  const days = getDaysArray(startDay, endDay);

  // Init chart data object
  const chartDataObjet: any = {};
  days.forEach((d) => {
    chartDataObjet[d] = {
      day: d,
      nbAccounts: 0,
      nbCodes: 0,
      nbAccountsStrong: 0,
      nbAccountsMedium: 0,
      nbAccountsWeak: 0,
      nbAccountsWithNoPassword: 0,
      nbDuplicatePasswords: 0,
      nbAccountsGreen: 0,
      nbAccountsOrange: 0,
      nbAccountsRed: 0,
    };
  });

  // Then map each day to its stats
  const userList = Object.keys(chartDataPerUserPerDay);
  userList.forEach((u) => {
    let lastKnownStats: any = null;
    const userStats = chartDataPerUserPerDay[u];
    days.forEach((d) => {
      if (userStats[d]) {
        lastKnownStats = userStats[d];
      }
      chartDataObjet[d].nbCodes += lastKnownStats?.nb_codes || 0;
      chartDataObjet[d].nbAccountsStrong += lastKnownStats?.nb_accounts_strong || 0;
      chartDataObjet[d].nbAccountsMedium += lastKnownStats?.nb_accounts_medium || 0;
      chartDataObjet[d].nbAccountsWeak += lastKnownStats?.nb_accounts_weak || 0;
      chartDataObjet[d].nbAccountsWithNoPassword +=
        lastKnownStats?.nb_accounts_with_no_password || 0;
      chartDataObjet[d].nbAccounts += lastKnownStats?.nb_accounts || 0;
      chartDataObjet[d].nbDuplicatePasswords +=
        lastKnownStats?.nb_accounts_with_duplicate_password || 0;
      chartDataObjet[d].nbAccountsGreen += lastKnownStats?.nb_accounts_green || 0;
      chartDataObjet[d].nbAccountsOrange += lastKnownStats?.nb_accounts_orange || 0;
      chartDataObjet[d].nbAccountsRed += lastKnownStats?.nb_accounts_green || 0;
    });
  });

  const result = Object.values(chartDataObjet);
  return JSON.stringify(result);
};

const sendToUpSignOn = (status: any) => {
  const dataString = JSON.stringify(status);

  const options = {
    hostname: 'app.upsignon.eu',
    port: 443,
    path: '/pro-status',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const req = https.request(options, () => {});

  req.on('error', (error) => {
    console.error(error);
  });

  req.write(dataString);
  req.end();
};
