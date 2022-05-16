/* eslint-disable @typescript-eslint/no-var-requires */
import path from 'path';
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

import express from 'express';
import expressSession from 'express-session';
import SessionStore from './helpers/sessionStore';

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
import { updateContactItemRights } from './routes/updateContactItemRights';
import { stopSharingWithContact } from './routes/stopSharingWithContact';
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
import { getContactsSharingItemsWithMeV2 } from './routes/getContactsSharingItemsWithMeV2';
import { createSharedFolder } from './routes/createSharedFolder';
import { addSharedItemsToSharedFolder } from './routes/addSharedItemsToSharedFolder';
import { changeSharedFolderName } from './routes/changeSharedFolderName';
import { getContactsForSharedFolder } from './routes/getContactsForSharedFolder';
import { updateContactSharedFolderRights } from './routes/updateContactSharedFolderRights';
import { stopSharingFolderWithContact } from './routes/stopSharingFolderWithContact';
import { getContactsForSharedItemV2 } from './routes/getContactsForSharedItemV2';
import { makeMyselfSoleManagerOfSharedFolder } from './routes/makeMyselfSoleManagerOfSharedFolder';
import { updateSharedFolderIdForSharedItem } from './routes/updateSharedFolderIdForSharedItem';
import { unshareItemsThatWereMovedFromSharedFolder } from './routes/unsharedItemsThatWereMovedFromSharedFolder';
import { migrateToCryptographicAuthentication } from './routes/migrateToCryptographicAuthentication';
import { getAuthenticationChallenges } from './routes/getAuthenticationChallenges';
import { authenticate } from './routes/authenticate';
import { addNewData } from './routes/addNewData';

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
app.use(
  expressSession({
    cookie: {
      path: '/',
      httpOnly: true,
      secure: env.IS_PRODUCTION,
      maxAge: 3600000, // one hour
      sameSite: 'none', // used to be "env.IS_PRODUCTION ? 'strict' : 'lax'", but this cause the safari extension not to work for pro spaces => TODO change it back when the app becomes available as a true macos app and the requests
    },
    name: 'upsignon_device_session',
    // @ts-ignore
    secret: env.SESSION_SECRET,
    resave: false,
    rolling: false,
    saveUninitialized: false,
    unset: 'destroy',
    store: new SessionStore(),
  }),
);

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
app.get('/test-email', testEmail);

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
app.post(['/:groupId/get-matching-email-addresses-for-sharing','/get-matching-email-addresses-for-sharing'], getMatchingEmailAddressesForSharing);
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
