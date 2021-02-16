import nodemailer from 'nodemailer';
import env from './env';

export const sendDeviceRequestEmail = async (
  emailAddress: string,
  deviceName: string,
  hostname: string,
  requestId: string,
  requestToken: string,
): Promise<void> => {
  try {
    const transportOptions = {
      host: env.EMAIL_HOST,
      port: env.EMAIL_PORT,
      secure: env.EMAIL_PORT === 465,
      auth: {
        user: env.EMAIL_USER,
        pass: env.EMAIL_PASS,
      },
    };
    const transporter = nodemailer.createTransport(transportOptions);

    const link = `https://${hostname}/check-device?requestId=${requestId}&requestToken=${requestToken}`;
    transporter.sendMail({
      from: env.EMAIL_USER,
      to: emailAddress,
      subject: "Nouvelle demande d'accès à votre espace UpSignOn PRO",
      text: `Bonjour,\nPour autoriser votre appareil "${deviceName}" à accéder à votre espace confidentiel UpSignOn PRO, ouvrez le lien suivant dans votre navigateur.\n\n${link}\n\nBonne journée,\nUpSignOn`,
    });
  } catch (e) {
    console.error('ERROR sending email:', e);
  }
};
