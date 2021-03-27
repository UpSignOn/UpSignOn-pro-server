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
import { getContactForSharedItem } from './routes/getContactsForSharedItem';
import { checkUserPublicKey } from './routes/checkUserPublicKey';
import { updateDeviceMetaData } from './routes/updateDeviceMetaData';

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '3Mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/check-device', checkDevice);

app.post('/config', getConfig);
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
app.post('/check-email-address-for-sharing', checkEmailAddressForSharing);
app.post('/share', share);
app.post('/update-shared-item', updateSharedItem);
app.post('/get-contacts-public-keys', getContactsPublicKeys);
app.post('/update-contact-rights', updateContactRights);
app.post('/stop-sharing-with-contact', stopSharingWithContact);
app.post('/get-contacts-for-shared-item', getContactForSharedItem);
app.post('/check-user-public-key', checkUserPublicKey);
app.post('/update-device-metadata', updateDeviceMetaData);

if (module === require.main) {
  startServer(app);
}

module.exports = app;
