import { cleanForHTMLInjections } from './cleanForHTMLInjections';
import env from './env';
import { getEmailConfig, getMailTransporter } from './getMailTransporter';
import { logError } from './logger';

export const sendDeviceRequestEmail = async (
  emailAddress: string,
  deviceName: string,
  deviceType: string,
  deviceOS: string,
  requestToken: string,
  expirationDate: Date,
): Promise<void> => {
  try {
    const emailConfig = await getEmailConfig();
    const transporter = getMailTransporter(emailConfig, { debug: false });
    const expDate =
      expirationDate.getDate() +
      '/' +
      (expirationDate.getMonth() + 1) +
      ' à ' +
      expirationDate.getHours() +
      ':' +
      expirationDate.getMinutes();

    // prevent HTML injections
    const safeEmailAddress = cleanForHTMLInjections(emailAddress);
    const safeDeviceName = cleanForHTMLInjections(deviceName);
    const safeDeviceType = cleanForHTMLInjections(deviceType);
    const safeDeviceOS = cleanForHTMLInjections(deviceOS);
    const safeRequestToken = cleanForHTMLInjections(requestToken);

    await transporter.sendMail({
      from: emailConfig.EMAIL_USER,
      to: safeEmailAddress,
      subject: "Nouvelle demande d'accès à votre espace UpSignOn PRO",
      text: `Bonjour,\nPour autoriser votre appareil "${safeDeviceName}" (${safeDeviceType} ${safeDeviceOS}) à accéder à votre espace confidentiel UpSignOn PRO, saisissez le code suivant :\n\n${safeRequestToken}\n\nCe code est valable jusqu'au ${expDate}.\n\nBonne journée,\nUpSignOn`,
      html: `<body><p>Bonjour,</p><p>Pour autoriser votre appareil "${safeDeviceName}" (${safeDeviceType} ${safeDeviceOS}) à accéder à votre espace confidentiel UpSignOn PRO, saisissez le code suivant :</p><p style="font-family:monospace;font-size: 20px; font-weight: bold; margin: 20px 0;">${safeRequestToken}</p><p>Ce code est valable jusqu'au ${expDate}.</p><p>Bonne journée,<br/>UpSignOn</p></body>`,
    });
  } catch (e) {
    logError('ERROR sending email:', e);
  }
};
