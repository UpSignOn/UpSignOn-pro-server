/* eslint-disable @typescript-eslint/no-var-requires */
import path from 'path';
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

import express from 'express';
import { SessionStore } from './helpers/sessionStore';

import { startServer } from './helpers/serverProcess';

import env from './helpers/env';
import { logInfo } from './helpers/logger';
import { migrateEmailConfig } from './api1/helpers/migrateEmailConfig';
import { runMigrations } from './helpers/runMigrations';
import { api2Router } from './api2/api2';
import { api1Router } from './api1/api1';

const app = express();

// Set express trust-proxy so that secure sessions cookies can work
app.set('trust proxy', 1);

app.disable('x-powered-by');
app.use(express.json({ limit: '3Mb' }));
app.use(express.urlencoded({ extended: true }));

// SESSIONS
if (!env.SESSION_SECRET) {
  console.error('Missing SESSION_SECRET in .env file.');
  process.exit(1);
}
SessionStore.init();

app.use((req, res, next) => {
  logInfo(req.url);
  if (!env.IS_PRODUCTION) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  next();
});

app.get('/', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).send('UpSignOn PRO server is running');
});

// GROUP ROUTING with or without groupid (default groupid is 1)
app.use("/:groupId/api2", api2Router);
app.use("/api2", api2Router);

app.use("/:groupId/", api1Router);
app.use("/", api1Router);

// DEPRECATED

if (module === require.main) {
  runMigrations().then(migrateEmailConfig).then(() => {
    startServer(app, () => {
      logInfo(`You can try to open in your browser\n  - https://${env.API_PUBLIC_HOSTNAME}\n`);
      logInfo(
        `Your setup link is https://upsignon.eu/pro-setup?url=https://${env.API_PUBLIC_HOSTNAME}`,
      );
    });
  });
}

module.exports = app;
