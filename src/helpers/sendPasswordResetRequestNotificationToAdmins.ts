import { db } from './db';
import { getEmailConfig, getMailTransporter } from './getMailTransporter';
import { logError } from './logger';
import { inputSanitizer } from './sanitizer';

export const sendPasswordResetRequestNotificationToAdmins = async (
  emailAddress: string,
  groupId: number,
): Promise<void> => {
  try {
    const emailConfig = await getEmailConfig();
    const transporter = getMailTransporter(emailConfig, { debug: false });

    // prevent HTML injections
    const safeEmailAddress = inputSanitizer.cleanForHTMLInjections(emailAddress);

    const admins = await db.query(
      'SELECT email FROM admins AS a LEFT JOIN admin_groups AS ag ON ag.admin_id = a.id WHERE a.is_superadmin OR ag.group_id=$1',
      [groupId],
    );

    const emails = admins.rows.map((admin) => admin.email);
    if (emails.length === 0) return;

    transporter.sendMail({
      from: emailConfig.EMAIL_SENDING_ADDRESS,
      to: emails,
      subject: 'Un utilisateur a oublié son mot de passe',
      text: `Bonjour,\nNous vous informons que l'utilisateur ${safeEmailAddress} a oublié son mot de passe maître de coffre-fort UpSignOn PRO et a besoin de votre aide pour le réinitialiser.\n\nBonne journée,\nUpSignOn`,
      html: `<body><p>Bonjour,</p><p>Nous vous informons que l'utilisateur <strong>"${safeEmailAddress}"</strong> a oublié son mot de passe maître de coffre-fort UpSignOn PRO et a besoin de votre aide pour le réinitialiser.</p><p>Bonne journée,<br/>UpSignOn</p></body>`,
    });
  } catch (e) {
    logError('ERROR sending password reset admin notification email:', e);
  }
};
