import nodemailer from 'nodemailer';
import { cleanForHTMLInjections } from './cleanForHTMLInjections';
import { extractTime } from './dateHelper';
import env from './env';
import { logError } from './logger';

export const sendPasswordResetRequestEmail = async (
  emailAddress: string,
  deviceName: string,
  requestToken: string,
  expirationDate: string,
): Promise<void> => {
  try {
    const transportOptions = {
      host: env.EMAIL_HOST,
      port: env.EMAIL_PORT,
      secure: env.EMAIL_PORT === 465,
    };
    if (env.EMAIL_PASS) {
      // @ts-ignore
      transportOptions.auth = {
        user: env.EMAIL_USER,
        pass: env.EMAIL_PASS,
      };
    }
    const transporter = nodemailer.createTransport(transportOptions);

    // prevent HTML injections
    const safeEmailAddress = cleanForHTMLInjections(emailAddress);
    const safeDeviceName = cleanForHTMLInjections(deviceName);
    const safeRequestToken = cleanForHTMLInjections(requestToken);

    const expirationTime = extractTime(expirationDate);
    transporter.sendMail({
      from: env.EMAIL_USER,
      to: safeEmailAddress,
      subject: 'Réinitialisation de votre mot de passe UpSignOn PRO',
      text: `Bonjour,\nVous avez effectué une demande de réinitialisation de votre mot de passe depuis votre appareil "${safeDeviceName}".\n\nPour réinitiliaser votre mot de passe UpSignOn PRO, saisissez le code suivant :\n\n${safeRequestToken}\n\nAttention, ce code n'est valide que pour l'appareil "${safeDeviceName}" et expirera à ${expirationTime}.\n\nBonne journée,\nUpSignOn`,
      html: `<body><p>Bonjour,</p><p>Vous avez effectué une demande de réinitialisation de votre mot de passe depuis votre appareil "${safeDeviceName}".</p><p>Pour réinitiliaser votre mot de passe UpSignOn PRO, saisissez le code suivant :</p><p style="font-family:monospace;font-size: 20px; font-weight: bold; margin: 20px 0;">${safeRequestToken}</p><p>Attention, ce code n'est valide que pour l'appareil "${safeDeviceName}" et expirera à ${expirationTime}.</p><p>Bonne journée,<br/>UpSignOn</p></body>`,
    });
  } catch (e) {
    logError('ERROR sending email:', e);
  }
};
