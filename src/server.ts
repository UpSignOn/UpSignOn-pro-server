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

const groupRouter = express.Router();
groupRouter.all('/config', getConfig);
groupRouter.post('/url-list', getUrlList);
groupRouter.post('/request-access', requestAccess);
groupRouter.post('/request-password-reset', requestPasswordReset);
groupRouter.post('/remove-authorization', removeAuthorization);
groupRouter.post('/get-authorized-devices', getAuthorizedDevices);
groupRouter.post('/get-data', getData);
groupRouter.post('/update-data', updateData);
groupRouter.post('/rename-device', renameDevice);
groupRouter.post('/backup-password', backupPassword);
groupRouter.post('/get-password-backup', getPasswordBackup);
groupRouter.post('/get-matching-email-addresses-for-sharing', getMatchingEmailAddressesForSharing);
groupRouter.post('/get-contacts-sharing-items-with-me', getContactsSharingItemsWithMe);
groupRouter.post('/check-email-address-for-sharing', checkEmailAddressForSharing);
groupRouter.post('/share', share);
groupRouter.post('/update-shared-item', updateSharedItem);
groupRouter.post('/get-contacts-public-keys', getContactsPublicKeys);
groupRouter.post('/update-contact-rights', updateContactRights);
groupRouter.post('/stop-sharing-with-contact', stopSharingWithContact);
groupRouter.post('/delete-sharing', deleteSharing);
groupRouter.post('/delete-singled-sharings', deleteSingledSharings);
groupRouter.post('/stop-receiving-sharing', stopReceivingSharing);
groupRouter.post('/get-contacts-for-shared-item', getContactsForSharedItem);
groupRouter.post('/check-user-public-key', checkUserPublicKey);
groupRouter.post('/update-device-metadata', updateDeviceMetaData);
groupRouter.post('/log-usage', logUsage);
groupRouter.post('/send-stats', sendStats);

// default group is 1 (for retrocompatibility)
app.use('/', groupRouter);
// group sent in url
app.use('/:groupId/', groupRouter);

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
