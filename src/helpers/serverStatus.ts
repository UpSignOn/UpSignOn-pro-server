import env from './env';
import { db } from './connection';
import childProcess from 'child_process';
import https from 'https';

export const sendStatusUpdate = async (): Promise<void> => {
  try {
    if (!env.IS_PRODUCTION) return;
    const gitCommit = childProcess.execSync('git rev-parse HEAD').toString().trim();
    const lastMigrationResult = await db.query(
      'SELECT name FROM migrations ORDER BY name desc limit 1',
    );
    const lastMigration = lastMigrationResult.rows[0].name;
    const licenseCountResult = await db.query('SELECT COUNT(*) FROM users');
    const licenseCount = licenseCountResult.rows[0].count;
    const userAppVersionsResult = await db.query('SELECT DISTINCT(app_version) FROM user_devices');
    const userAppVersions = userAppVersionsResult.rows.map((v) => v.app_version);

    const serverStatus = {
      displayName: env.ORGANISATION_NAME,
      gitCommit,
      lastMigration,
      licenseCount,
      userAppVersions,
    };

    sendToUpSignOn(serverStatus);
  } catch (e) {
    console.error(e);
  }
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
