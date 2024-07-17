/* eslint-disable @typescript-eslint/no-var-requires */
import path from 'path';
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

import express from 'express';
import { SessionStore } from './helpers/sessionStore';

import { startServer } from './helpers/serverProcess';

import env from './helpers/env';
import { logInfo } from './helpers/logger';
import { runMigrations } from './helpers/runMigrations';

import { getBankConfig } from './api2/routes/bank/getBankConfig';
import { getUrlList2 } from './api2/routes/bank/getUrlList';
import { requestDeviceAccess2 } from './api2/routes/deviceAuthorization/requestDeviceAccess';
import { checkDevice2 } from './api2/routes/deviceAuthorization/checkDevice';
import { getAuthenticationChallenges2 } from './api2/routes/authentication/getAuthenticationChallenges';
import { authenticate2 } from './api2/routes/authentication/authenticate';
import { updateVaultData } from './api2/routes/data/updateVaultData';
import { addNewData2 } from './api2/routes/data/addNewData';
import { getVaultData } from './api2/routes/data/getVaultData';
import { revokeDevice } from './api2/routes/devices/revokeDevice';
import { getAuthorizedDevices2 } from './api2/routes/devices/getAuthorizedDevices';
import { requestPasswordReset2 } from './api2/routes/passwordReset/requestPasswordReset';
import { getMatchingEmailAddressesForSharing2 } from './api2/routes/sharingRecipients/getMatchingEmailAddressesForSharing';
import { getRecipientPublicKey } from './api2/routes/sharingRecipients/getRecipientPublicKey';
import { createSharedVault } from './api2/routes/sharedVaults/createSharedVault';
import { getSharedVaultData } from './api2/routes/sharedVaults/getSharedVaultData';
import { updateSharedVaultData } from './api2/routes/sharedVaults/updateSharedVaultData';
import { renameSharedVault } from './api2/routes/sharedVaults/renameSharedVault';
import { deleteSharedVault } from './api2/routes/sharedVaults/deleteSharedVault';
import { getRecipientsForSharedVault } from './api2/routes/sharingRecipients/getRecipientsForSharedVault';
import { addRecipientToSharedVault } from './api2/routes/sharingRecipients/addRecipientToSharedVault';
import { updateRecipientRightsOnSharedVault } from './api2/routes/sharingRecipients/updateRecipientRightsOnSharedVault';
import { removeRecipientFromSharedVault } from './api2/routes/sharingRecipients/removeRecipientFromSharedVault';
import { disconnect2 } from './api2/routes/authentication/disconnect';
import { backupPassword2 } from './api2/routes/passwordReset/backupPassword';
import { getPasswordBackup2 } from './api2/routes/passwordReset/getPasswordBackup';
import { renameDevice2 } from './api2/routes/devices/renameDevice';
import { checkUserPublicKey2 } from './api2/routes/sharingRecipients/checkUserPublicKey';
import { updateDeviceMetaData2 } from './api2/routes/devices/updateDeviceMetaData';
import { logEvent } from './api2/routes/audit/logEvent';
import libsodium from 'libsodium-wrappers';
import { updateLicences } from './licences';

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
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  logInfo(req.body?.userEmail, ip, req.url);
  if (!env.IS_PRODUCTION) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  next();
});

app.get('/', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).send('UpSignOn PRO server is running');
});
app.post('/licences', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  return updateLicences(req, res);
});

// GROUP ROUTING with or without groupid (default groupid is 1)

// API 2
// BANK
app.all(['/:groupId/api2/bank-config', '/api2/bank-config'], getBankConfig);
app.post(['/:groupId/api2/url-list', '/api2/url-list'], getUrlList2);

// AUTHORIZATION
app.post(
  ['/:groupId/api2/request-device-access', '/api2/request-device-access'],
  requestDeviceAccess2,
);
app.post(['/:groupId/api2/check-device', '/api2/check-device'], checkDevice2);

// AUTHENTICATION
app.post(
  ['/:groupId/api2/get-authentication-challenges', '/api2/get-authentication-challenges'],
  getAuthenticationChallenges2,
);
app.post(['/:groupId/api2/authenticate', '/api2/authenticate'], authenticate2);
app.post(['/:groupId/api2/disconnect', '/api2/disconnect'], disconnect2);

// PASSWORD RESET
app.post(
  ['/:groupId/api2/request-password-reset', '/api2/request-password-reset'],
  requestPasswordReset2,
);
app.post(['/:groupId/api2/backup-password', '/api2/backup-password'], backupPassword2);
app.post(['/:groupId/api2/get-password-backup', '/api2/get-password-backup'], getPasswordBackup2);

// DATA
app.post(['/:groupId/api2/get-vault-data', '/api2/get-vault-data'], getVaultData);
app.post(['/:groupId/api2/update-vault-data', '/api2/update-vault-data'], updateVaultData);
app.post(['/:groupId/api2/add-new-data', '/api2/add-new-data'], addNewData2);

// DEVICES
app.post(
  ['/:groupId/api2/get-authorized-devices', '/api2/get-authorized-devices'],
  getAuthorizedDevices2,
);
app.post(['/:groupId/api2/rename-device', '/api2/rename-device'], renameDevice2);
app.post(['/:groupId/api2/revoke-device', '/api2/revoke-device'], revokeDevice);

// LOGS
app.post(['/:groupId/api2/log-event', '/api2/log-event'], logEvent);
app.post(
  ['/:groupId/api2/update-device-metadata', '/api2/update-device-metadata'],
  updateDeviceMetaData2,
);

// SHARED VAULTS
app.post(['/:groupId/api2/create-shared-vault', '/api2/create-shared-vault'], createSharedVault);
app.post(
  ['/:groupId/api2/get-shared-vault-data', '/api2/get-shared-vault-data'],
  getSharedVaultData,
);
app.post(
  ['/:groupId/api2/update-shared-vault-data', '/api2/update-shared-vault-data'],
  updateSharedVaultData,
);
app.post(['/:groupId/api2/rename-shared-vault', '/api2/rename-shared-vault'], renameSharedVault);
app.post(['/:groupId/api2/delete-shared-vault', '/api2/delete-shared-vault'], deleteSharedVault);

// SHARING RECIPIENTS
app.post(
  ['/:groupId/api2/check-user-public-key', '/api2/check-user-public-key'],
  checkUserPublicKey2,
);
app.post(
  [
    '/:groupId/api2/get-matching-email-addresses-for-sharing',
    '/api2/get-matching-email-addresses-for-sharing',
  ],
  getMatchingEmailAddressesForSharing2,
);
app.post(
  ['/:groupId/api2/get-recipient-public-key', '/api2/get-recipient-public-key'],
  getRecipientPublicKey,
);
app.post(
  ['/:groupId/api2/add-recipient-to-shared-vault', '/api2/add-recipient-to-shared-vault'],
  addRecipientToSharedVault,
);
app.post(
  ['/:groupId/api2/get-recipients-for-shared-vault', '/api2/get-recipients-for-shared-vault'],
  getRecipientsForSharedVault,
);
app.post(
  [
    '/:groupId/api2/update-recipient-rights-on-shared-vault',
    '/api2/update-recipient-rights-on-shared-vault',
  ],
  updateRecipientRightsOnSharedVault,
);
app.post(
  ['/:groupId/api2/remove-recipient-from-shared-vault', '/api2/remove-recipient-from-shared-vault'],
  removeRecipientFromSharedVault,
);

if (module === require.main) {
  runMigrations()
    .then(() => libsodium.ready)
    .then(() => {
      startServer(app, () => {
        logInfo(`You can try to open in your browser\n  - https://${env.API_PUBLIC_HOSTNAME}\n`);
        logInfo(
          `Your setup link is https://upsignon.eu/pro-setup?url=https://${env.API_PUBLIC_HOSTNAME}`,
        );
      });
    });
}

module.exports = app;
