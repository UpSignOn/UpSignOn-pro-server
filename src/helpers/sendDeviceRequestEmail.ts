import env from './env';
import { getMailTransporter } from './getMailTransporter';
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
    const transporter = getMailTransporter({ debug: false });
    const expDate =
      expirationDate.getDate() +
      '/' +
      (expirationDate.getMonth() + 1) +
      ' à ' +
      expirationDate.getHours() +
      ':' +
      expirationDate.getMinutes();
    await transporter.sendMail({
      from: env.EMAIL_USER,
      to: emailAddress,
      subject: "Nouvelle demande d'accès à votre espace UpSignOn PRO",
      text: `Bonjour,\nPour autoriser votre appareil "${deviceName}" (${deviceType} ${deviceOS}) à accéder à votre espace confidentiel UpSignOn PRO, saisissez le code suivant :\n\n${requestToken}\n\nCe code est valable jusqu'au ${expDate}.\n\nBonne journée,\nUpSignOn`,
      html: `<body><p>Bonjour,</p><p>Pour autoriser votre appareil "${deviceName}" (${deviceType} ${deviceOS}) à accéder à votre espace confidentiel UpSignOn PRO, saisissez le code suivant :</p><p style="font-size: 20px; font-weight: bold; margin: 20px 0;">${requestToken}</p><p>Ce code est valable jusqu'au ${expDate}.</p><p>Bonne journée,<br/>UpSignOn</p></body>`,
    });
  } catch (e) {
    logError('ERROR sending email:', e);
  }
};
