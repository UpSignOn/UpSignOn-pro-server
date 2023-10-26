import env from './env';
import fs from 'fs';
import path from 'path';
import { db } from './db';
import childProcess from 'child_process';
import https from 'https';
import http from 'http';
import { logError } from './logger';

export const sendStatusUpdate = async (): Promise<void> => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const serverVersion = require('../../package.json').version;
    const gitCommit = await new Promise((resolve) => {
      childProcess.exec('git rev-parse HEAD', (error, stdout) => {
        resolve(stdout?.toString().trim() || 'unknown');
      });
    });
    const lastMigrationResult = await db.query(
      'SELECT name FROM migrations ORDER BY name desc limit 1',
    );
    const lastMigration = lastMigrationResult.rows[0].name;
    const licenseCountResult = await db.query('SELECT COUNT(*) FROM users');
    const statsByGroup = await getStatsByGroup();
    const licenseCount = licenseCountResult.rows[0].count;
    const userAppVersionsResult = await db.query(
      `SELECT DISTINCT(app_version) FROM user_devices WHERE authorization_status='AUTHORIZED' ORDER BY app_version DESC`,
    );
    const userAppVersions = JSON.stringify(userAppVersionsResult.rows.map((v) => v.app_version));
    const detailedUserAppVersions = await db.query(
      `SELECT
        users.id AS user_id,
        users.email AS user_email,
        starts_with(users.encrypted_data, 'formatP001-') AS formatP001,
        starts_with(users.encrypted_data_2, 'formatP002-') AS formatP002,
        starts_with(users.encrypted_data_2, 'formatP003-') AS formatP003,
        length(users.encrypted_data_2) AS data_length,
        COALESCE((
          SELECT JSON_AGG(
            json_build_object(
              't', device_type,
              'os', os_version,
              'v', app_version,
              'last', (SELECT TO_CHAR(date :: DATE, 'yyyy-mm-dd') FROM usage_logs WHERE log_type='SESSION' AND device_id=user_devices.id ORDER BY date DESC LIMIT 1)
            )
          )
          FROM user_devices WHERE user_devices.user_id = users.id
        ), '[]'::json) AS devices
      FROM users
      GROUP BY users.id`,
    );
    const stats: { def: string[]; data: number[] } = await getStats();
    const hasDailyBackup = getHasDailyBackup();
    const serverStatus = {
      serverUrl: env.API_PUBLIC_HOSTNAME,
      gitCommit,
      serverVersion,
      lastMigration,
      licenseCount,
      userAppVersions,
      securityGraph: JSON.stringify(stats),
      statsByGroup,
      detailedUserAppVersions: JSON.stringify(detailedUserAppVersions.rows),
      hasDailyBackup,
    };

    sendToUpSignOn(serverStatus);
  } catch (e) {
    logError('sendStatusUpdate', e);
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

const getStats = async (): Promise<{ def: string[]; data: any[] }> => {
  const rawStats = await db.query(
    "SELECT user_id, shared_vault_id, date_trunc('day', date) as day, nb_accounts, nb_codes, nb_accounts_strong, nb_accounts_medium, nb_accounts_weak, nb_accounts_with_no_password, nb_accounts_with_duplicated_password, nb_accounts_red, nb_accounts_orange, nb_accounts_green FROM data_stats ORDER BY day ASC",
  );

  if (rawStats.rowCount === 0) {
    return { def: [], data: [] };
  }

  /*
   * First get chartDataPerVaultPerDay = {
   *  [userId]: {
   *    [day]: stats
   *  }
   * }
   */
  const chartDataPerVaultPerDay: any = {};
  rawStats.rows.forEach((r: any) => {
    if (r.user_id) {
      if (!chartDataPerVaultPerDay['v' + r.user_id]) {
        chartDataPerVaultPerDay['v' + r.user_id] = {};
      }
      chartDataPerVaultPerDay['v' + r.user_id][r.day.toISOString()] = r;
    } else {
      if (!chartDataPerVaultPerDay['sv' + r.shared_vault_id]) {
        chartDataPerVaultPerDay['sv' + r.shared_vault_id] = {};
      }
      chartDataPerVaultPerDay['sv' + r.shared_vault_id][r.day.toISOString()] = r;
    }
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
      d: d, // day
      n: 0, // accounts
      cd: 0, // codes
      st: 0, // strong
      md: 0, // medium
      wk: 0, // weak
      no: 0, // no password
      dp: 0, // duplicate
      gr: 0, // green
      or: 0, // orange
      rd: 0, // red
    };
  });

  // Then map each day to its stats
  const userList = Object.keys(chartDataPerVaultPerDay);
  userList.forEach((u) => {
    let lastKnownStats: any = null;
    const userStats = chartDataPerVaultPerDay[u];
    days.forEach((d) => {
      if (userStats[d]) {
        lastKnownStats = userStats[d];
      }
      chartDataObjet[d].n += lastKnownStats?.nb_accounts || 0;
      chartDataObjet[d].cd += lastKnownStats?.nb_codes || 0;
      chartDataObjet[d].st += lastKnownStats?.nb_accounts_strong || 0;
      chartDataObjet[d].md += lastKnownStats?.nb_accounts_medium || 0;
      chartDataObjet[d].wk += lastKnownStats?.nb_accounts_weak || 0;
      chartDataObjet[d].no += lastKnownStats?.nb_accounts_with_no_password || 0;
      chartDataObjet[d].dp += lastKnownStats?.nb_accounts_with_duplicated_password || 0;
      chartDataObjet[d].gr += lastKnownStats?.nb_accounts_green || 0;
      chartDataObjet[d].or += lastKnownStats?.nb_accounts_orange || 0;
      chartDataObjet[d].rd += lastKnownStats?.nb_accounts_red || 0;
    });
  });

  const result = Object.values(chartDataObjet);
  return {
    def: ['d', 'n', 'cd', 'st', 'md', 'wk', 'no', 'dp', 'gr', 'or', 'rd'],
    // @ts-ignore
    data: result.map((val: any) => [
      val.d.split('T')[0],
      val.n,
      val.cd,
      val.st,
      val.md,
      val.wk,
      val.no,
      val.dp,
      val.gr,
      val.or,
      val.rd,
    ]),
  };
};

const sendToUpSignOn = (status: any) => {
  const dataString = JSON.stringify(status);

  let req;
  if (env.IS_PRODUCTION) {
    const options = {
      hostname: 'app.upsignon.eu',
      port: 443,
      path: '/pro-status',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    req = https.request(options, () => {});
  } else {
    const options = {
      hostname: 'localhost',
      port: 8080,
      path: '/pro-status',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    req = http.request(options, () => {});
  }

  req.on('error', (error) => {
    logError('sendToUpSignOn', error);
  });

  req.write(dataString);
  req.end();
  console.log('Sent status');
};

const getStatsByGroup = async () => {
  const res = await db.query(
    'SELECT groups.name, groups.created_at, groups.nb_licences_sold, (SELECT COUNT(users.id) FROM users WHERE users.group_id=groups.id) AS nb_users FROM groups',
  );
  return JSON.stringify(res.rows);
};

const getHasDailyBackup = () => {
  if (!env.DB_BACKUP_DIR) return false;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const folderName = `${yesterday.toISOString().split('T')[0]}-daily`;
  return fs.existsSync(path.join(env.DB_BACKUP_DIR, folderName));
};
