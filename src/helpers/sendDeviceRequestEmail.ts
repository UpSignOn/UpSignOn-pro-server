import env from './env';
import { getMailTransporter } from './getMailTransporter';

export const sendDeviceRequestEmail = async (
  emailAddress: string,
  deviceName: string,
  deviceType: string,
  deviceOS: string,
  hostname: string,
  requestId: string,
  requestToken: string,
): Promise<void> => {
  try {
    const transporter = getMailTransporter({ debug: false });
    const link = `https://${hostname}/check-device?requestId=${requestId}&requestToken=${requestToken}`;
    await transporter.sendMail({
      from: env.EMAIL_USER,
      to: emailAddress,
      subject: "Nouvelle demande d'accès à votre espace UpSignOn PRO",
      text: `Bonjour,\nPour autoriser votre appareil "${deviceName}" (${deviceType} ${deviceOS}) à accéder à votre espace confidentiel UpSignOn PRO, ouvrez le lien suivant dans votre navigateur.\n\n${link}\n\nBonne journée,\nUpSignOn`,
    });
  } catch (e) {
    console.error('ERROR sending email:', e);
  }
};
