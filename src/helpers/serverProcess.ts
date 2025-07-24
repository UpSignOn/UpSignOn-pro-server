import env from './env';
import { db } from './db';
import https from 'https';
import fs from 'fs';
import { logError, logInfo } from './logger';
import { getActivationStatus, sendStatusUpdate } from './serverStatus';
import { cleanOldRevokedDevices, cleanOrphanSharedVaults } from './dbCleaner';
import { syncPeriodicallyWithMicrosoftEntra } from './syncWithMicrosoftEntra';
import { aggregateStatsDaily } from './dailyStats';
import { setupMSGraph } from './init_ms_graph';

if (env.HTTP_PROXY) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const globalAgent = require('global-agent');
  globalAgent.bootstrap();
  // @ts-ignore
  global.GLOBAL_AGENT.HTTP_PROXY = env.HTTP_PROXY;
}

async function cronjob(randomDelay: number) {
  await cleanOldRevokedDevices();
  await cleanOrphanSharedVaults();
  await getActivationStatus();
  setTimeout(async () => {
    await sendStatusUpdate();
    // randomize the time of the call in the next 5 minutes to avoid overloading the server
  }, randomDelay || 0);
}

export const startServer = (app: any, then: any): void => {
  setupMSGraph();
  const serverEnv = process.env.NODE_ENV === 'production' ? 'Production' : 'Dev';
  if (env.LOCALHOST_SSL_CERTIFICATE_KEY_PATH && env.LOCALHOST_SSL_CERTIFICATE_CRT_PATH) {
    const options = {
      key: fs.readFileSync(env.LOCALHOST_SSL_CERTIFICATE_KEY_PATH),
      cert: fs.readFileSync(env.LOCALHOST_SSL_CERTIFICATE_CRT_PATH),
    };
    const server = https.createServer(options, app).listen(env.SERVER_PORT, () => {
      const address = server.address();
      if (!address) {
        logError(`${serverEnv} server COULD NOT START`);
        return;
      }
      logInfo(`${serverEnv} server listening`, server.address());
      then();
    });
    listenForGracefulShutdown(server);
  } else {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const server = app.listen(env.SERVER_PORT, () => {
      const address = server.address();
      if (!address) {
        logError(`${serverEnv} server COULD NOT START`);
        return;
      }
      logInfo(`${serverEnv} server listening `, address);
    });
    listenForGracefulShutdown(server);
  }
  cronjob(0);
  // Add status update every day and avoid all calls at the same time by randomizing the interval
  setInterval(() => cronjob(60 * 5 * Math.random() * 1000), 24 * 3600 * 1000);

  syncPeriodicallyWithMicrosoftEntra();
  aggregateStatsDaily();
  // sendMailForDeviceUpdate();
};

const listenForGracefulShutdown = (server: any) => {
  process.on('SIGINT', () => {
    server.close(() => {
      logInfo('Graceful shutdown');
      db.gracefulShutdown().then(() => {
        process.exit();
      });
    });
  });
};
