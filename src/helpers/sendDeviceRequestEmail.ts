import nodemailer from 'nodemailer';
import env from './env';

export const sendDeviceRequestEmail = async (
  emailAddress: string,
  deviceName: string,
  deviceType: string,
  deviceOS: string,
  hostname: string,
  requestId: string,
  requestToken: string,
  verificationMode?: boolean,
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
      debug: !!verificationMode,
    };
    const transporter = nodemailer.createTransport(transportOptions);

    const sendMail = async () => {
      const link = `https://${hostname}/check-device?requestId=${requestId}&requestToken=${requestToken}`;
      await transporter.sendMail({
        from: env.EMAIL_USER,
        to: emailAddress,
        subject: "Nouvelle demande d'accès à votre espace UpSignOn PRO",
        text: `Bonjour,\nPour autoriser votre appareil "${deviceName}" (${deviceType} ${deviceOS}) à accéder à votre espace confidentiel UpSignOn PRO, ouvrez le lien suivant dans votre navigateur.\n\n${link}\n\nBonne journée,\nUpSignOn`,
      });
    };

    if (verificationMode) {
      transporter.verify(function (error) {
        if (error) {
          console.log('Email configuration is not correct.');
          console.log(error);
          console.error(error);
        } else {
          console.log('Email configuration seems correct.');
          sendMail().catch((e) => {
            console.error('Error sending email while configuration is correct.', e);
          });
        }
      });
    } else {
      await sendMail();
    }
  } catch (e) {
    console.error('ERROR sending email:', e);
  }
};
