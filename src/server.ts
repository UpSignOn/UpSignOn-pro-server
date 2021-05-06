/* eslint-disable @typescript-eslint/no-var-requires */
import path from 'path';
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

import passport from 'passport';
import saml from 'passport-saml';

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
import { logUsage } from './routes/logUsage';

passport.use(
  new saml.Strategy(
    {
      entryPoint: 'https://ad.example.net/adfs/ls/',
      issuer: 'https://upsignonpro.example.net/login/callback',
      callbackUrl: 'https://upsignonpro.example.net/login/callback',
      cert: 'MIICizCCAfQCCQCY8tKaMc0BMjANBgkqh ... W==',
      authnContext: 'http://schemas.microsoft.com/ws/2008/06/identity/authenticationmethod/windows',
      identifierFormat: null,
      // disableRequestedAuthnContext: true, // see issue https://github.com/node-saml/passport-saml/issues/226
    },
    function (profile: { email: null | string }, done: any) {
      findByEmail(profile.email, function (err, user) {
        if (err) {
          return done(err);
        }
        return done(null, user);
      });
    },
  ),
);

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '3Mb' }));
app.use(express.urlencoded({ extended: true }));

app.post(
  '/login/callback',
  passport.authenticate('saml', { failureRedirect: '/', failureFlash: true }),
  function (req, res) {
    res.redirect('/');
  },
);

app.get('/check-device', passport.authenticate('saml', { session: false }), checkDevice);

app.post('/config', passport.authenticate('saml', { session: false }), getConfig);
app.post('/url-list', passport.authenticate('saml', { session: false }), getUrlList);
app.post('/request-access', passport.authenticate('saml', { session: false }), requestAccess);
app.post(
  '/request-password-reset',
  passport.authenticate('saml', { session: false }),
  requestPasswordReset,
);
app.post(
  '/remove-authorization',
  passport.authenticate('saml', { session: false }),
  removeAuthorization,
);
app.post(
  '/get-authorized-devices',
  passport.authenticate('saml', { session: false }),
  getAuthorizedDevices,
);
app.post('/get-data', passport.authenticate('saml', { session: false }), getData);
app.post('/update-data', passport.authenticate('saml', { session: false }), updateData);
app.post('/rename-device', passport.authenticate('saml', { session: false }), renameDevice);
app.post('/backup-password', passport.authenticate('saml', { session: false }), backupPassword);
app.post(
  '/get-password-backup',
  passport.authenticate('saml', { session: false }),
  getPasswordBackup,
);
app.post(
  '/check-email-address-for-sharing',
  passport.authenticate('saml', { session: false }),
  checkEmailAddressForSharing,
);
app.post('/share', passport.authenticate('saml', { session: false }), share);
app.post(
  '/update-shared-item',
  passport.authenticate('saml', { session: false }),
  updateSharedItem,
);
app.post(
  '/get-contacts-public-keys',
  passport.authenticate('saml', { session: false }),
  getContactsPublicKeys,
);
app.post(
  '/update-contact-rights',
  passport.authenticate('saml', { session: false }),
  updateContactRights,
);
app.post(
  '/stop-sharing-with-contact',
  passport.authenticate('saml', { session: false }),
  stopSharingWithContact,
);
app.post(
  '/get-contacts-for-shared-item',
  passport.authenticate('saml', { session: false }),
  getContactForSharedItem,
);
app.post(
  '/check-user-public-key',
  passport.authenticate('saml', { session: false }),
  checkUserPublicKey,
);
app.post(
  '/update-device-metadata',
  passport.authenticate('saml', { session: false }),
  updateDeviceMetaData,
);
app.post('/log-usage', passport.authenticate('saml', { session: false }), logUsage);

if (module === require.main) {
  startServer(app);
}

module.exports = app;
