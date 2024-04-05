import { getAdminEmailsForGroup } from './getAdminsEmailsForGroup';
import { getEmailConfig, getMailTransporter } from './getMailTransporter';
import { logError } from './logger';
import { inputSanitizer } from './sanitizer';

export const sendDeviceRequestEmail = async (
  emailAddress: string,
  deviceName: null | string,
  deviceType: null | string,
  osNameAndVersion: null | string,
  requestToken: string,
  expirationDate: Date,
): Promise<void> => {
  try {
    const emailConfig = await getEmailConfig();
    const transporter = getMailTransporter(emailConfig, { debug: false });
    const expDate = expirationDate.toLocaleDateString();
    const expTime = expirationDate.toLocaleTimeString().split(':').slice(0, 2).join(':');

    // prevent HTML injections
    const safeEmailAddress = inputSanitizer.cleanForHTMLInjections(emailAddress);
    const safeDeviceName = inputSanitizer.cleanForHTMLInjections(deviceName || '');
    const safeDeviceType = inputSanitizer.cleanForHTMLInjections(deviceType || '');
    const safeOSNameAndVersion = inputSanitizer.cleanForHTMLInjections(osNameAndVersion || '');
    const safeRequestToken = inputSanitizer.cleanForHTMLInjections(requestToken);

    await transporter.sendMail({
      from: emailConfig.EMAIL_SENDING_ADDRESS,
      to: safeEmailAddress,
      subject: "Nouvelle demande d'accès à votre espace UpSignOn PRO",
      text: `Bonjour,\nPour autoriser votre appareil "${safeDeviceName}" (${safeDeviceType} ${safeOSNameAndVersion}) à accéder à votre espace confidentiel UpSignOn PRO, saisissez le code suivant :\n\n${safeRequestToken}\n\nCe code est valable jusqu'au ${expDate} à ${expTime}.\n\nBonne journée,\nUpSignOn`,
      html: `<body><p>Bonjour,</p><p>Pour autoriser votre appareil "${safeDeviceName}" (${safeDeviceType} ${safeOSNameAndVersion}) à accéder à votre espace confidentiel UpSignOn PRO, saisissez le code suivant :</p><p style="font-family:monospace;font-size: 20px; font-weight: bold; margin: 20px 0;">${safeRequestToken}</p><p>Ce code est valable jusqu'au ${expDate} à ${expTime}.</p><p>Bonne journée,<br/>UpSignOn</p></body>`,
    });
  } catch (e) {
    logError('ERROR sending email:', e);
  }
};

export const sendDeviceRequestAdminEmail = async (
  userEmailAddress: string,
  groupId: number,
): Promise<void> => {
  try {
    const emailConfig = await getEmailConfig();
    const transporter = getMailTransporter(emailConfig, { debug: false });

    const adminEmails = await getAdminEmailsForGroup(groupId);
    if (adminEmails.length === 0) return;

    // prevent HTML injections
    const safeUserEmailAddress = inputSanitizer.cleanForHTMLInjections(userEmailAddress);

    await transporter.sendMail({
      from: emailConfig.EMAIL_SENDING_ADDRESS,
      to: adminEmails,
      subject: 'UpSignOn Admin: deuxième appareil',
      text: `Bonjour,\nL'utilisateur ${safeUserEmailAddress} a effectué une demande pour autoriser un nouvel appareil. Cet utilisateur a déjà un appareil autorisé ou en cours d'autorisation et a donc besoin de votre accord pour cette opération, conformément au paramètre que vous avez défini pour cette banque.\n\nBonne journée,\nUpSignOn`,
      html: `<body><p>Bonjour,</p><p>L'utilisateur ${safeUserEmailAddress} a effectué une demande pour autoriser un nouvel appareil. Cet utilisateur a déjà un appareil autorisé ou en cours d'autorisation et a donc besoin de votre accord pour cette opération, conformément au paramètre que vous avez défini pour cette banque.</p><p>Bonne journée,<br/>UpSignOn</p></body>`,
    });
  } catch (e) {
    logError('ERROR sending email:', e);
  }
};
