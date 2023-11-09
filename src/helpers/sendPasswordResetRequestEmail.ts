import { extractTime } from './dateHelper';
import { getEmailConfig, getMailTransporter } from './getMailTransporter';
import { logError } from './logger';
import { inputSanitizer } from './sanitizer';

export const sendPasswordResetRequestEmail = async (
  emailAddress: string,
  deviceName: string,
  requestToken: string,
  expirationDate: string,
): Promise<void> => {
  try {
    const emailConfig = await getEmailConfig();
    const transporter = getMailTransporter(emailConfig, { debug: false });

    // prevent HTML injections
    const safeEmailAddress = inputSanitizer.cleanForHTMLInjections(emailAddress);
    const safeDeviceName = inputSanitizer.cleanForHTMLInjections(deviceName);
    const safeRequestToken = inputSanitizer.cleanForHTMLInjections(requestToken);

    const expirationTime = extractTime(expirationDate);
    transporter.sendMail({
      from: emailConfig.EMAIL_SENDING_ADDRESS,
      to: safeEmailAddress,
      subject: 'Réinitialisation de votre mot de passe UpSignOn PRO',
      text: `Bonjour,\nVous avez effectué une demande de réinitialisation de votre mot de passe depuis votre appareil "${safeDeviceName}".\n\nPour réinitiliaser votre mot de passe UpSignOn PRO, saisissez le code suivant :\n\n${safeRequestToken}\n\nAttention, ce code n'est valide que pour l'appareil "${safeDeviceName}" et expirera à ${expirationTime}.\n\nBonne journée,\nUpSignOn`,
      html: `<body><p>Bonjour,</p><p>Vous avez effectué une demande de réinitialisation de votre mot de passe depuis votre appareil "${safeDeviceName}".</p><p>Pour réinitiliaser votre mot de passe UpSignOn PRO, saisissez le code suivant :</p><p style="font-family:monospace;font-size: 20px; font-weight: bold; margin: 20px 0;">${safeRequestToken}</p><p>Attention, ce code n'est valide que pour l'appareil "${safeDeviceName}" et expirera à ${expirationTime}.</p><p>Bonne journée,<br/>UpSignOn</p></body>`,
    });
  } catch (e) {
    logError('ERROR sending password reset email:', e);
  }
};
