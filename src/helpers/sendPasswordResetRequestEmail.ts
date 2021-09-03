import nodemailer from 'nodemailer';
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

    const expirationTime = extractTime(expirationDate);
    transporter.sendMail({
      from: env.EMAIL_USER,
      to: emailAddress,
      subject: 'Réinitialisation de votre mot de passe UpSignOn PRO',
      text: `Bonjour,\nVous avez effectué une demande de réinitialisation de votre mot de passe depuis votre appareil "${deviceName}".\n\nPour réinitiliaser votre mot de passe UpSignOn PRO, saisissez le code suivant.\n\n${requestToken}\n\nAttention, ce code n'est valide que pour l'appareil "${deviceName}" et expirera à ${expirationTime}.\n\nBonne journée,\nUpSignOn`,
    });
  } catch (e) {
    logError('ERROR sending email:', e);
  }
};
