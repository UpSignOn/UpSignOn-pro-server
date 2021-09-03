import env from './env';
import { db } from './connection';
import https from 'https';
import fs from 'fs';
import { logInfo } from './logger';

export const startServer = (app: any, then: any): void => {
  if (env.SSL_CERTIFICATE_KEY_PATH && env.SSL_CERTIFICATE_CRT_PATH) {
    // Set express trust-proxy so that secure sessions cookies can work
    app.set('trust proxy', 1);
    const options = {
      key: fs.readFileSync(env.SSL_CERTIFICATE_KEY_PATH),
      cert: fs.readFileSync(env.SSL_CERTIFICATE_CRT_PATH),
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
