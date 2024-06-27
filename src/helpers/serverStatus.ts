import env from './env';
import fs from 'fs';
import path from 'path';
import { db } from './db';
import childProcess from 'child_process';
import https from 'https';
import http from 'http';
import { logError } from './logger';
import { checkServerCertificateChain } from './certificateChainChecker';

export const sendStatusUpdate = async (): Promise<void> => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const serverVersion = require('../../package.json').version;
    const nodeVersion = await new Promise((resolve) => {
      childProcess.exec('node --version', (error, stdout) => {
        resolve(stdout?.toString().trim() || 'unknown');
      });
    });
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
        starts_with(users.encrypted_data_2, 'formatP003-') AS hasMigrated
      FROM users
      GROUP BY users.id`,
    );
    const deviceStats = await db.query(
      'SELECT os_family, device_type, os_version FROM user_devices',
    );
    const stats: { def: string[]; data: number[] } = await getStats();
    const hasDailyBackup = getHasDailyBackup();
    const serverStatus = {
      serverUrl: env.API_PUBLIC_HOSTNAME,
      serverVersion,
      licenseCount,
      userAppVersions,
      securityGraph: JSON.stringify(stats),
      statsByGroup,
      detailedUserAppVersions: JSON.stringify(detailedUserAppVersions.rows),
      hasDailyBackup,
      nodeVersion,
      deviceStats,
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
  // hypothesis : if a stat exists for a group for a day, then there exists a stats for other groups fro that day too. (The computation succeeds in whole or not at all)
  const rawStats = await db.query(
    `SELECT
      date,
      SUM(nb_accounts) AS nb_accounts,
      SUM(nb_codes) AS nb_codes,
      SUM(nb_accounts_strong) AS nb_accounts_strong,
      SUM(nb_accounts_medium) AS nb_accounts_medium,
      SUM(nb_accounts_weak) AS nb_accounts_weak,
      SUM(nb_accounts_with_duplicated_password) AS nb_accounts_with_duplicated_password,
      SUM(nb_accounts_with_no_password) AS nb_accounts_with_no_password,
      SUM(nb_accounts_red) AS nb_accounts_red,
      SUM(nb_accounts_orange) AS nb_accounts_orange,
      SUM(nb_accounts_green) AS nb_accounts_green
    FROM pwd_stats_evolution GROUP BY date ORDER BY date ASC`,
  );
  if (!rawStats?.rowCount || rawStats.rowCount === 0) {
    return { def: [], data: [] };
  }

  // Then get the continuous list of days
  let days: string[];
  const startDay = rawStats.rows[0].date;
  let endDay = rawStats.rows[rawStats.rowCount - 1].date;
  endDay = new Date(endDay);
  endDay.setDate(endDay.getDate() + 1);
  endDay.setHours(0, 0, 0, 0);
  endDay = endDay.toISOString();
  days = getDaysArray(startDay, endDay).map((d) => d.split('T')[0]);

  let lastStatIndex = 0;
  let lastValueUsed = [
    days[0], // day
    0, // accounts
    0, // codes
    0, // strong
    0, // medium
    0, // weak
    0, // no password
    0, // duplicate
    0, // green
    0, // orange
    0, // red
  ];
  const graph = days.map((d) => {
    const row = rawStats.rows[lastStatIndex];
    if (row && row.date.toISOString().split('T')[0] === d) {
      lastValueUsed = [
        d,
        row.nb_accounts,
        row.nb_codes,
        row.nb_accounts_strong,
        row.nb_accounts_medium,
        row.nb_accounts_weak,
        row.nb_accounts_with_no_password,
        row.nb_accounts_with_duplicated_password,
        row.nb_accounts_green,
        row.nb_accounts_orange,
        row.nb_accounts_red,
      ];
      lastStatIndex++;
    }
    return lastValueUsed;
  });

  return {
    def: ['d', 'n', 'cd', 'st', 'md', 'wk', 'no', 'dp', 'gr', 'or', 'rd'],
    data: graph,
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
  if (yesterday.getDay() === 0) {
    // sunday
    yesterday.setDate(yesterday.getDate() - 1);
  }
  if (yesterday.getDay() === 6) {
    // saturday
    yesterday.setDate(yesterday.getDate() - 2);
  }
  yesterday.setDate(yesterday.getDate() - 1);
  const folderNameDaily = `${yesterday.toISOString().split('T')[0]}-daily`;
  const folderNameWeekly = `${yesterday.toISOString().split('T')[0]}-weekly`;
  const folderNameMonthly = `${yesterday.toISOString().split('T')[0]}-monthly`;
  return (
    fs.existsSync(path.join(env.DB_BACKUP_DIR, folderNameDaily)) ||
    fs.existsSync(path.join(env.DB_BACKUP_DIR, folderNameWeekly)) ||
    fs.existsSync(path.join(env.DB_BACKUP_DIR, folderNameMonthly))
  );
};

const isCertificateChainComplete = async (): Promise<boolean> => {
  try {
    const settingsRes = await db.query(
      "SELECT value FROM settings WHERE key='PRO_SERVER_URL_CONFIG'",
    );
    if (settingsRes.rowCount === 0) {
      return false;
    }

    const isCertificateChainComplete = await checkServerCertificateChain(
      new URL(settingsRes.rows[0]?.value?.url).host,
    );
    return isCertificateChainComplete;
  } catch (e) {
    logError('isCertificateChainComplete error:', e);
    return false;
  }
};
