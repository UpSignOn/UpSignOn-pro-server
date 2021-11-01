/* eslint-disable @typescript-eslint/no-var-requires */
import path from 'path';
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

import express from 'express';
import { startServer } from './helpers/serverProcess';
import { requestAccess } from './routes/requestAccess';
import { checkDevice } from './routes/checkDevice';
import { getData } from './routes/getData';
import { updateData } from './routes/updateData';
import { getConfig } from './routes/getConfig';
import { getUrlList } from './routes/getUrlList';
import { removeAuthorization } from './routes/removeAuthorization';
import { getAuthorizedDevices } from './routes/getAuthorizedDevices';
import { renameDevice } from './routes/renameDevice';
import { backupPassword } from './routes/backupPassword';
import { requestPasswordReset } from './routes/requestPasswordReset';
import { getPasswordBackup } from './routes/getPasswordBackup';
import { checkEmailAddressForSharing } from './routes/checkEmailAddressForSharing';
import { share } from './routes/share';
import { updateSharedItem } from './routes/updateSharedItem';
import { getContactsPublicKeys } from './routes/getContactsPublicKeys';
import { updateContactRights } from './routes/updateContactRights';
import { stopSharingWithContact } from './routes/stopSharingWithContact';
import { getContactsForSharedItem } from './routes/getContactsForSharedItem';
import { checkUserPublicKey } from './routes/checkUserPublicKey';
import { updateDeviceMetaData } from './routes/updateDeviceMetaData';
import { logUsage } from './routes/logUsage';
import { testEmail } from './routes/testEmail';
import { verifyEmail } from './helpers/verifyEmail';
import env from './helpers/env';
import { logInfo } from './helpers/logger';
import { getMatchingEmailAddressesForSharing } from './routes/getMatchingEmailAddressesForSharing';
import { getContactsSharingItemsWithMe } from './routes/getContactsSharingItemsWithMe';
import { deleteSharing } from './routes/deleteSharing';
import { stopReceivingSharing } from './routes/stopReceivingSharing';
import { deleteSingledSharings } from './routes/deleteSingledSharings';
import { sendStats } from './routes/sendStats';

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '3Mb' }));
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  logInfo(req.url);
  next();
});

app.get('/', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).send('UpSignOn PRO server is running');
});
app.get('/check-device', checkDevice);
app.get('/test-email', testEmail);

// GROUP ROUTING with or without groupid (default groupid is 1)
app.all(['/:groupId/config', '/config'], getConfig);
app.post(['/:groupId/url-list', '/url-list'], getUrlList);
app.post(['/:groupId/request-access', '/request-access'], requestAccess);
app.post(['/:groupId/request-password-reset', '/request-password-reset'], requestPasswordReset);
app.post(['/:groupId/remove-authorization', '/remove-authorization'], removeAuthorization);
app.post(['/:groupId/get-authorized-devices', '/get-authorized-devices'], getAuthorizedDevices);
app.post(['/:groupId/get-data', '/get-data'], getData);
app.post(['/:groupId/update-data', '/update-data'], updateData);
app.post(['/:groupId/rename-device', '/rename-device'], renameDevice);
app.post(['/:groupId/backup-password', '/backup-password'], backupPassword);
app.post(['/:groupId/get-password-backup', '/get-password-backup'], getPasswordBackup);
// prettier-ignore
app.post(['/:groupId/get-matching-email-addresses-for-sharing','/get-matching-email-addresses-for-sharing'], getMatchingEmailAddressesForSharing);
// prettier-ignore
app.post(['/:groupId/get-contacts-sharing-items-with-me', '/get-contacts-sharing-items-with-me'], getContactsSharingItemsWithMe);
// prettier-ignore
app.post(['/:groupId/check-email-address-for-sharing', '/check-email-address-for-sharing'], checkEmailAddressForSharing);
app.post(['/:groupId/share', '/share'], share);
app.post(['/:groupId/update-shared-item', '/update-shared-item'], updateSharedItem);
// prettier-ignore
app.post(['/:groupId/get-contacts-public-keys', '/get-contacts-public-keys'], getContactsPublicKeys);
app.post(['/:groupId/update-contact-rights', '/update-contact-rights'], updateContactRights);
// prettier-ignore
app.post(['/:groupId/stop-sharing-with-contact', '/stop-sharing-with-contact'], stopSharingWithContact);
app.post(['/:groupId/delete-sharing', '/delete-sharing'], deleteSharing);
app.post(['/:groupId/delete-singled-sharings', '/delete-singled-sharings'], deleteSingledSharings);
app.post(['/:groupId/stop-receiving-sharing', '/stop-receiving-sharing'], stopReceivingSharing);
// prettier-ignore
app.post(['/:groupId/get-contacts-for-shared-item', '/get-contacts-for-shared-item'], getContactsForSharedItem);
app.post(['/:groupId/check-user-public-key', '/check-user-public-key'], checkUserPublicKey);
app.post(['/:groupId/update-device-metadata', '/update-device-metadata'], updateDeviceMetaData);
app.post(['/:groupId/log-usage', '/log-usage'], logUsage);
app.post(['/:groupId/send-stats', '/send-stats'], sendStats);

if (module === require.main) {
  startServer(app, () => {
    logInfo(
      `You can try to open in your browser\n  - https://${env.API_PUBLIC_HOSTNAME}\n  - https://${env.API_PUBLIC_HOSTNAME}/test-email?email=<YOUR_EMAIL>`,
    );
    logInfo(
      `Your setup link is https://upsignon.eu/pro-setup?url=https://${env.API_PUBLIC_HOSTNAME}`,
    );
    verifyEmail();
  });
}

module.exports = app;
