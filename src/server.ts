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
import { getSharedVaultKeysToMigrate } from './api1/routes/migrationToV6/getSharedVaultKeysToMigrate';
import { migrateSharingPublicKey } from './api1/routes/migrationToV6/migrateSharingPublicKey';
import { migrateDeviceAuthenticationKey } from './api1/routes/migrationToV6/migrateDeviceAuthenticationKey';
import { migrateSharedVaultKeys } from './api1/routes/migrationToV6/migrateSharedVaultKeys';
import { updateDeviceAppVersion } from './api1/routes/updateDeviceAppVersion';
import { markAllMigratedSharedItems } from './api1/routes/migrationToV6/markAllMigratedSharedItems';
import { getV5OrV6AuthenticationChallenges } from './api1/routes/migrationToV6/getV5OrV6AuthenticationChallenges';
import { updateSharingPubKey } from './api1/routes/updateSharingPubKey';
import { getV5Data } from './api1/routes/migrationToV6/getV5Data';

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
  logInfo(req.body?.userEmail, req.url);
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
app.post(['/:groupId/api2/get-v5-vault-data', '/api2/get-v5-vault-data'], getV5Data);
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

///////////////////////////////////
// API 1
///////////////////////////////////
// BANK
app.all(['/:groupId/config', '/config'], getConfig);
app.post(['/:groupId/url-list', '/url-list'], getUrlList);

// AUTHORIZATION
app.post(['/:groupId/request-access', '/request-access'], requestAccess);
app.post(['/:groupId/check-device', '/check-device'], checkDevice);

// AUTHENTICATION
app.post(
  ['/:groupId/migrate-to-cryptographic-authentication', '/migrate-to-cryptographic-authentication'],
  migrateToCryptographicAuthentication,
);
app.post(
  ['/:groupId/get-authentication-challenges', '/get-authentication-challenges'],
  getAuthenticationChallenges,
);
app.post(
  ['/:groupId/get-v5-or-v6-authentication-challenges', '/get-v5-or-v6-authentication-challenges'],
  getV5OrV6AuthenticationChallenges,
);
app.post(['/:groupId/authenticate', '/authenticate'], authenticate);
app.post(['/:groupId/disconnect', '/disconnect'], disconnect);

// PASSWORD RESET
app.post(['/:groupId/request-password-reset', '/request-password-reset'], requestPasswordReset);
app.post(['/:groupId/backup-password', '/backup-password'], backupPassword);
app.post(['/:groupId/get-password-backup', '/get-password-backup'], getPasswordBackup);

// DATA
app.post(['/:groupId/get-data', '/get-data'], getData);
app.post(['/:groupId/update-data', '/update-data'], updateData);
app.post(['/:groupId/add-new-data', '/add-new-data'], addNewData);

// DEVICES
app.post(['/:groupId/get-authorized-devices', '/get-authorized-devices'], getAuthorizedDevices);
app.post(['/:groupId/rename-device', '/rename-device'], renameDevice);
app.post(['/:groupId/remove-authorization', '/remove-authorization'], removeAuthorization);

// LOGS
app.post(['/:groupId/log-usage', '/log-usage'], logUsage);
app.post(['/:groupId/send-stats', '/send-stats'], sendStats);
app.post(['/:groupId/update-device-metadata', '/update-device-metadata'], updateDeviceMetaData);

// SHARING
// SHARING CONTACTS
app.post(['/:groupId/update-sharing-pub-key', '/update-sharing-pub-key'], updateSharingPubKey);
app.post(['/:groupId/check-user-public-key', '/check-user-public-key'], checkUserPublicKey);
app.post(
  [
    '/:groupId/get-matching-email-addresses-for-sharing',
    '/get-matching-email-addresses-for-sharing',
  ],
  getMatchingEmailAddressesForSharing,
);
app.post(
  ['/:groupId/check-email-address-for-sharing', '/check-email-address-for-sharing'],
  checkEmailAddressForSharing,
);
app.post(
  ['/:groupId/get-contacts-public-keys', '/get-contacts-public-keys'],
  getContactsPublicKeys,
);
app.post(
  ['/:groupId/get-contacts-sharing-items-with-me', '/get-contacts-sharing-items-with-me'],
  getContactsSharingItemsWithMe,
);
app.post(
  ['/:groupId/get-contacts-sharing-items-with-me-v2', '/get-contacts-sharing-items-with-me-v2'],
  getContactsSharingItemsWithMeV2,
);
app.post(
  ['/:groupId/get-contacts-for-shared-item-v2', '/get-contacts-for-shared-item-v2'],
  getContactsForSharedItemV2,
);
//SHARING ITEMS
app.post(['/:groupId/share', '/share'], share);
app.post(['/:groupId/update-shared-item', '/update-shared-item'], updateSharedItem);
app.post(['/:groupId/update-contact-rights', '/update-contact-rights'], updateContactItemRights);
app.post(
  ['/:groupId/stop-sharing-with-contact', '/stop-sharing-with-contact'],
  stopSharingWithContact,
);
app.post(['/:groupId/delete-sharing', '/delete-sharing'], deleteSharing);
app.post(['/:groupId/delete-singled-sharings', '/delete-singled-sharings'], deleteSingledSharings);
app.post(['/:groupId/stop-receiving-sharing', '/stop-receiving-sharing'], stopReceivingSharing);
// SHARING FOLDERS
app.post(['/:groupId/create-shared-folder', '/create-shared-folder'], createSharedFolder);
app.post(
  ['/:groupId/add-shared-items-to-shared-folder', '/add-shared-items-to-shared-folder'],
  addSharedItemsToSharedFolder,
);
app.post(
  ['/:groupId/change-shared-folder-name', '/change-shared-folder-name'],
  changeSharedFolderName,
);
app.post(
  ['/:groupId/get-contacts-for-shared-folder', '/get-contacts-for-shared-folder'],
  getContactsForSharedFolder,
);
app.post(
  ['/:groupId/update-contact-shared-folder-rights', '/update-contact-shared-folder-rights'],
  updateContactSharedFolderRights,
);
app.post(
  ['/:groupId/stop-sharing-folder-with-contact', '/stop-sharing-folder-with-contact'],
  stopSharingFolderWithContact,
);
app.post(
  [
    '/:groupId/make-myself-sole-manager-of-shared-folder',
    '/make-myself-sole-manager-of-shared-folder',
  ],
  makeMyselfSoleManagerOfSharedFolder,
);
app.post(
  ['/:groupId/update-shared-folder-id-for-item', '/update-shared-folder-id-for-item'],
  updateSharedFolderIdForSharedItem,
);
app.post(
  [
    '/:groupId/unshare-items-that-were-moved-from-shared-folder',
    '/unshare-items-that-were-moved-from-shared-folder',
  ],
  unshareItemsThatWereMovedFromSharedFolder,
);

// MIGRATION TO V6
app.post(['/:groupId/get-data-v6', '/get-data-v6'], getVaultData);
app.post(['/:groupId/update-data-v6', '/update-data-v6'], updateVaultData);
app.post(
  ['/:groupId/update-device-app-version', '/update-device-app-version'],
  updateDeviceAppVersion,
);
app.post(
  ['/:groupId/get-shared-vault-keys-to-migrate', '/get-shared-vault-keys-to-migrate'],
  getSharedVaultKeysToMigrate,
);
app.post(
  ['/:groupId/migrate-shared-vault-keys', '/migrate-shared-vault-keys'],
  migrateSharedVaultKeys,
);
app.post(
  ['/:groupId/migrate-device-authentication-key', '/migrate-device-authentication-key'],
  migrateDeviceAuthenticationKey,
);
app.post(
  ['/:groupId/migrate-sharing-public-key', '/migrate-sharing-public-key'],
  migrateSharingPublicKey,
);
app.post(
  ['/:groupId/mark-all-migrated-shared-items', '/mark-all-migrated-shared-items'],
  markAllMigratedSharedItems,
);

if (module === require.main) {
  runMigrations()
    .then(migrateEmailConfig)
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
