import env from './env';
import { db } from './db';
import https from 'https';
import fs from 'fs';
import { logInfo } from './logger';
import { sendStatusUpdate } from './serverStatus';
import { cleanOldRevokedDevices, cleanOrphanSharedVaults } from './dbCleaner';

if (env.HTTP_PROXY) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const globalAgent = require('global-agent');
  globalAgent.bootstrap();
  // @ts-ignore
  global.GLOBAL_AGENT.HTTP_PROXY = env.HTTP_PROXY;
}

async function cronjob() {
  await cleanOldRevokedDevices();
  await cleanOrphanSharedVaults();
  await sendStatusUpdate();
}

export const startServer = (app: any, then: any): void => {
  if (env.LOCALHOST_SSL_CERTIFICATE_KEY_PATH && env.LOCALHOST_SSL_CERTIFICATE_CRT_PATH) {
    const options = {
      key: fs.readFileSync(env.LOCALHOST_SSL_CERTIFICATE_KEY_PATH),
      cert: fs.readFileSync(env.LOCALHOST_SSL_CERTIFICATE_CRT_PATH),
    };
    const server = https.createServer(options, app).listen(env.SERVER_PORT, () => {
      logInfo(
        `${process.env.NODE_ENV === 'production' ? 'Production' : 'Dev'} server listening`,
        server.address(),
      );
      then();
    });
    listenForGracefulShutdown(server);
  } else {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const server = app.listen(env.SERVER_PORT, () => {
      logInfo(
        `${process.env.NODE_ENV === 'production' ? 'Production' : 'Dev'} server listening`,
        server.address(),
      );
    });
    listenForGracefulShutdown(server);
  }
  cronjob();
  setInterval(cronjob, 24 * 3600 * 1000);
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
