/* eslint-disable @typescript-eslint/no-var-requires */
import path from 'path';
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

import express from 'express';
import { SessionStore } from './helpers/sessionStore';

import { startServer } from './helpers/serverProcess';
import { requestAccess } from './api1/routes/requestAccess';
import { checkDevice } from './api1/routes/checkDevice';
import { getData } from './api1/routes/getData';
import { updateData } from './api1/routes/updateData';
import { getConfig } from './api1/routes/getConfig';
import { getUrlList } from './api1/routes/getUrlList';
import { removeAuthorization } from './api1/routes/removeAuthorization';
import { getAuthorizedDevices } from './api1/routes/getAuthorizedDevices';
import { renameDevice } from './api1/routes/renameDevice';
import { backupPassword } from './api1/routes/backupPassword';
import { requestPasswordReset } from './api1/routes/requestPasswordReset';
import { getPasswordBackup } from './api1/routes/getPasswordBackup';
import { checkEmailAddressForSharing } from './api1/routes/checkEmailAddressForSharing';
import { share } from './api1/routes/share';
import { updateSharedItem } from './api1/routes/updateSharedItem';
import { getContactsPublicKeys } from './api1/routes/getContactsPublicKeys';
import { updateContactItemRights } from './api1/routes/updateContactItemRights';
import { stopSharingWithContact } from './api1/routes/stopSharingWithContact';
import { checkUserPublicKey } from './api1/routes/checkUserPublicKey';
import { updateDeviceMetaData } from './api1/routes/updateDeviceMetaData';
import { logUsage } from './api1/routes/logUsage';
import env from './helpers/env';
import { logInfo } from './helpers/logger';
import { getMatchingEmailAddressesForSharing } from './api1/routes/getMatchingEmailAddressesForSharing';
import { getContactsSharingItemsWithMe } from './api1/routes/getContactsSharingItemsWithMe';
import { deleteSharing } from './api1/routes/deleteSharing';
import { stopReceivingSharing } from './api1/routes/stopReceivingSharing';
import { deleteSingledSharings } from './api1/routes/deleteSingledSharings';
import { sendStats } from './api1/routes/sendStats';
import { getContactsSharingItemsWithMeV2 } from './api1/routes/getContactsSharingItemsWithMeV2';
import { createSharedFolder } from './api1/routes/createSharedFolder';
import { addSharedItemsToSharedFolder } from './api1/routes/addSharedItemsToSharedFolder';
import { changeSharedFolderName } from './api1/routes/changeSharedFolderName';
import { getContactsForSharedFolder } from './api1/routes/getContactsForSharedFolder';
import { updateContactSharedFolderRights } from './api1/routes/updateContactSharedFolderRights';
import { stopSharingFolderWithContact } from './api1/routes/stopSharingFolderWithContact';
import { getContactsForSharedItemV2 } from './api1/routes/getContactsForSharedItemV2';
import { makeMyselfSoleManagerOfSharedFolder } from './api1/routes/makeMyselfSoleManagerOfSharedFolder';
import { updateSharedFolderIdForSharedItem } from './api1/routes/updateSharedFolderIdForSharedItem';
import { unshareItemsThatWereMovedFromSharedFolder } from './api1/routes/unsharedItemsThatWereMovedFromSharedFolder';
import { migrateToCryptographicAuthentication } from './api1/routes/migrateToCryptographicAuthentication';
import { getAuthenticationChallenges } from './api1/routes/getAuthenticationChallenges';
import { authenticate } from './api1/routes/authenticate';
import { addNewData } from './api1/routes/addNewData';
import { disconnect } from './api1/routes/disconnect';
import { migrateEmailConfig } from './api1/helpers/migrateEmailConfig';
import { runMigrations } from './helpers/runMigrations';
import { api2Router } from './api2/api2';

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

app.use('/api2', api2Router);


// DEPRECATED
// GROUP ROUTING with or without groupid (default groupid is 1)
app.all(['/:groupId/config', '/config'], getConfig);
app.post(['/:groupId/url-list', '/url-list'], getUrlList);
app.post(
  ['/:groupId/migrate-to-cryptographic-authentication', '/migrate-to-cryptographic-authentication'],
  migrateToCryptographicAuthentication,
);
app.post(
  ['/:groupId/get-authentication-challenges', '/get-authentication-challenges'],
  getAuthenticationChallenges,
);
app.post(['/:groupId/authenticate', '/authenticate'], authenticate);
app.post(['/:groupId/disconnect', '/disconnect'], disconnect);
app.post(['/:groupId/request-access', '/request-access'], requestAccess);
app.post(['/:groupId/check-device', '/check-device'], checkDevice);
app.post(['/:groupId/request-password-reset', '/request-password-reset'], requestPasswordReset);
app.post(['/:groupId/remove-authorization', '/remove-authorization'], removeAuthorization);
app.post(['/:groupId/get-authorized-devices', '/get-authorized-devices'], getAuthorizedDevices);
app.post(['/:groupId/get-data', '/get-data'], getData);
app.post(['/:groupId/update-data', '/update-data'], updateData);
app.post(['/:groupId/add-new-data', '/add-new-data'], addNewData);
app.post(['/:groupId/rename-device', '/rename-device'], renameDevice);
app.post(['/:groupId/backup-password', '/backup-password'], backupPassword);
app.post(['/:groupId/get-password-backup', '/get-password-backup'], getPasswordBackup);
// prettier-ignore
app.post(['/:groupId/get-matching-email-addresses-for-sharing', '/get-matching-email-addresses-for-sharing'], getMatchingEmailAddressesForSharing);
// prettier-ignore
app.post(['/:groupId/get-contacts-sharing-items-with-me', '/get-contacts-sharing-items-with-me'], getContactsSharingItemsWithMe);
// prettier-ignore
app.post(['/:groupId/get-contacts-sharing-items-with-me-v2', '/get-contacts-sharing-items-with-me-v2'], getContactsSharingItemsWithMeV2);
// prettier-ignore
app.post(['/:groupId/check-email-address-for-sharing', '/check-email-address-for-sharing'], checkEmailAddressForSharing);
app.post(['/:groupId/share', '/share'], share);
app.post(['/:groupId/create-shared-folder', '/create-shared-folder'], createSharedFolder);
// prettier-ignore
app.post(['/:groupId/add-shared-items-to-shared-folder', '/add-shared-items-to-shared-folder'], addSharedItemsToSharedFolder);
app.post(['/:groupId/update-shared-item', '/update-shared-item'], updateSharedItem);
// prettier-ignore
app.post(['/:groupId/get-contacts-public-keys', '/get-contacts-public-keys'], getContactsPublicKeys);
app.post(['/:groupId/update-contact-rights', '/update-contact-rights'], updateContactItemRights);
// prettier-ignore
app.post(['/:groupId/stop-sharing-with-contact', '/stop-sharing-with-contact'], stopSharingWithContact);
app.post(['/:groupId/delete-sharing', '/delete-sharing'], deleteSharing);
app.post(['/:groupId/delete-singled-sharings', '/delete-singled-sharings'], deleteSingledSharings);
app.post(['/:groupId/stop-receiving-sharing', '/stop-receiving-sharing'], stopReceivingSharing);
// prettier-ignore
app.post(['/:groupId/get-contacts-for-shared-item-v2', '/get-contacts-for-shared-item-v2'], getContactsForSharedItemV2);
app.post(['/:groupId/check-user-public-key', '/check-user-public-key'], checkUserPublicKey);
app.post(['/:groupId/update-device-metadata', '/update-device-metadata'], updateDeviceMetaData);
app.post(['/:groupId/log-usage', '/log-usage'], logUsage);
app.post(['/:groupId/send-stats', '/send-stats'], sendStats);
// prettier-ignore
app.post(['/:groupId/change-shared-folder-name', '/change-shared-folder-name'], changeSharedFolderName);
// prettier-ignore
app.post(['/:groupId/get-contacts-for-shared-folder', '/get-contacts-for-shared-folder'], getContactsForSharedFolder);
// prettier-ignore
app.post(['/:groupId/update-contact-shared-folder-rights', '/update-contact-shared-folder-rights'], updateContactSharedFolderRights);
// prettier-ignore
app.post(['/:groupId/stop-sharing-folder-with-contact', '/stop-sharing-folder-with-contact'], stopSharingFolderWithContact);
// prettier-ignore
app.post(['/:groupId/make-myself-sole-manager-of-shared-folder', '/make-myself-sole-manager-of-shared-folder'], makeMyselfSoleManagerOfSharedFolder);
// prettier-ignore
app.post(['/:groupId/update-shared-folder-id-for-item', '/update-shared-folder-id-for-item'], updateSharedFolderIdForSharedItem);
// prettier-ignore
app.post(['/:groupId/unshare-items-that-were-moved-from-shared-folder', '/unshare-items-that-were-moved-from-shared-folder'], unshareItemsThatWereMovedFromSharedFolder);

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
