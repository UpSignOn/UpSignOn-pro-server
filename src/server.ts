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

app.get('/', (req, res) => res.status(200).send('UpSignOn PRO server is running'));
app.get('/check-device', checkDevice);
app.get('/test-email', testEmail);

app.post('/config', getConfig);
app.get('/config', getConfig);
app.post('/url-list', getUrlList);
app.post('/request-access', requestAccess);
app.post('/request-password-reset', requestPasswordReset);
app.post('/remove-authorization', removeAuthorization);
app.post('/get-authorized-devices', getAuthorizedDevices);
app.post('/get-data', getData);
app.post('/update-data', updateData);
app.post('/rename-device', renameDevice);
app.post('/backup-password', backupPassword);
app.post('/get-password-backup', getPasswordBackup);
app.post('/get-matching-email-addresses-for-sharing', getMatchingEmailAddressesForSharing);
app.post('/get-contacts-sharing-items-with-me', getContactsSharingItemsWithMe);
app.post('/check-email-address-for-sharing', checkEmailAddressForSharing);
app.post('/share', share);
app.post('/update-shared-item', updateSharedItem);
app.post('/get-contacts-public-keys', getContactsPublicKeys);
app.post('/update-contact-rights', updateContactRights);
app.post('/stop-sharing-with-contact', stopSharingWithContact);
app.post('/delete-sharing', deleteSharing);
app.post('/delete-singled-sharings', deleteSingledSharings);
app.post('/stop-receiving-sharing', stopReceivingSharing);
app.post('/get-contacts-for-shared-item', getContactsForSharedItem);
app.post('/check-user-public-key', checkUserPublicKey);
app.post('/update-device-metadata', updateDeviceMetaData);
app.post('/log-usage', logUsage);
app.post('/send-stats', sendStats);

if (module === require.main) {
  startServer(app, () => {
    logInfo(
      `You can try to open in your browser\n  - https://${env.API_PUBLIC_HOSTNAME}/config\n  - https://${env.API_PUBLIC_HOSTNAME}/test-email?email=<YOUR_EMAIL>`,
    );
    logInfo(
      `Your setup link is https://upsignon.eu/pro-setup?url=https://${env.API_PUBLIC_HOSTNAME}`,
    );
    verifyEmail();
  });
}

module.exports = app;
