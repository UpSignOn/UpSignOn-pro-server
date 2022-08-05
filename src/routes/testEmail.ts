import { logError } from '../helpers/logger';
import { cleanForHTMLInjections } from '../helpers/cleanForHTMLInjections';
import { getEmailConfig, getMailTransporter } from '../helpers/getMailTransporter';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const testEmail = async (req: any, res: any) => {
  try {
    const userEmail = req.query.email;
    if (!userEmail) return res.status(400).send('Please provide your email in the url.');

    const emailConfig = await getEmailConfig();

    const transporter = getMailTransporter(emailConfig, { debug: false });

    // prevent HTML injections
    const safeEmailAddress = cleanForHTMLInjections(userEmail);

    await transporter.sendMail({
      from: emailConfig.EMAIL_USER,
      to: safeEmailAddress,
      subject: 'Test',
      text: `Bonjour,\nL'envoi de mail depuis votre serveur UpSignOn PRO fonctionne correctement :)`,
    });
    // Return res
    return res.status(200).send('Un email vous a été envoyé.');
  } catch (e) {
    logError('ERROR sending email:', e);
    res.status(400).send();
  }
};
