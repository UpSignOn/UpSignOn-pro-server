import { isStrictlyLowerVersion } from './appVersionChecker';
import { db } from './db';
import { getEmailConfig, getMailTransporter } from './getMailTransporter';
import { logError } from './logger';
import { inputSanitizer } from './sanitizer';

const getNext8am = (): Date => {
  const notificationDate = new Date();
  // first get next 8am time
  if (notificationDate.getHours() < 8) {
    notificationDate.setHours(8); // same day at 8am
    notificationDate.setMinutes(0);
    notificationDate.setSeconds(0);
    notificationDate.setMilliseconds(0);
  } else {
    notificationDate.setTime(notificationDate.getTime() + 24 * 3600 * 1000); // next day same hour
    notificationDate.setHours(8); // at 8 am
    notificationDate.setHours(0);
    notificationDate.setMinutes(0);
    notificationDate.setSeconds(0);
    notificationDate.setMilliseconds(0);
  }

  // then allow only mondays, wednesdays and fridays
  const d = notificationDate.getDay();
  if (d == 0 || d == 2 || d == 4) {
    // sunday -> monday
    // tuesday -> wednesday
    // thursday -> friday
    notificationDate.setTime(notificationDate.getTime() + 24 * 3600 * 1000);
  } else if (d == 6) {
    // saturday -> monday
    notificationDate.setTime(notificationDate.getTime() + 48 * 3600 * 1000);
  }
  return notificationDate;
};

export const sendMailForDeviceUpdate = async (): Promise<void> => {
  sendMailForDeviceUpdateTask();

  // call perform sync every two days at 8am
  setTimeout(() => {
    sendMailForDeviceUpdateTask();
    setInterval(sendMailForDeviceUpdateTask, 48 * 3600 * 1000); // call it every 48 hours
  }, getNext8am().getTime() - Date.now());
};

const sendMailForDeviceUpdateTask = async (): Promise<void> => {
  try {
    const emailsRes = await db.query(
      "SELECT u.email, d.device_name, d.device_type, d.app_version FROM users AS u RIGHT JOIN user_devices AS d ON d.user_id=u.id WHERE d.authorization_status = 'AUTHORIZED')",
    );
    if (emailsRes == null) return;
    const devicesByEmail: {
      [email: string]: { device_name: string; device_type: string; app_version: string }[];
    } = {};
    for (var i = 0; i < emailsRes.rows.length; i++) {
      const d = emailsRes.rows[i];
      if (isStrictlyLowerVersion(d.app_version, '7.10.3')) {
        if (!devicesByEmail[d.email]) {
          devicesByEmail[d.email] = [];
        }
        devicesByEmail[d.email].push(d);
      }
    }

    const emailConfig = await getEmailConfig();
    const transporter = getMailTransporter(emailConfig, { debug: false });
    const allEmails = Object.keys(devicesByEmail);
    for (var i = 0; i < allEmails.length; i++) {
      const email = allEmails[i];

      const outdatedDevices: { device_name: string; device_type: string; app_version: string }[] =
        devicesByEmail[email];
      const safeOutdatedDevices = outdatedDevices.map((d) => {
        return {
          name: inputSanitizer.cleanForHTMLInjections(d.device_name || ''),
          type: inputSanitizer.cleanForHTMLInjections(d.device_type || ''),
          v: inputSanitizer.cleanForHTMLInjections(d.app_version || ''),
        };
      });
      const safeEmailAddress = inputSanitizer.cleanForHTMLInjections(email);

      const line1 = 'Bonjour,';
      const line2 = "Votre application UpSignOn n'est pas à jour sur les appareils suivants :";
      const line3 =
        'À partir du 10 février 2025, les applications ayant une version inférieure à la version 7.10.5 ne pourront plus se synchroniser ou rencontront un crash au démarrage pour certaines versions.';
      const line4 = 'Nous vous invitons donc à procéder à leur mise-à-jour dès que possible.';
      const line5 =
        'NB : si vous n\'utilisez plus les appareils en question, ou si ces appareils sont des reliquats d\'applications désinstallées, vous pouvez les supprimer depuis la page "appareils synchronisés" directement dans votre coffre-fort.';
      const line6 = 'Bonne journée,';
      const line7 = 'UpSignOn';

      await transporter.sendMail({
        from: emailConfig.EMAIL_SENDING_ADDRESS,
        to: safeEmailAddress,
        replyTo: 'contact@upsignon.eu',
        subject: 'Application UpSignOn obsolète',
        text: `${line1}\n\n${line2}\n${safeOutdatedDevices.map((d) => `- ${d.name} - type ${d.type} - version ${d.v}`).join('\n')}\n\n${line3}\n${line4}\n\n${line5}\n\n${line6}\n${line7}`,
        html: `<body><p>${line1}</p><p>${line2}<p><ul><li>${safeOutdatedDevices.map((d) => `${d.name} - type ${d.type} - version ${d.v}`).join('</li><li>')}</li></ul><p>${line3}<br/>${line4}</p><p>${line5}</p><br/><p>${line6}<br/>${line7}</p></body>`,
      });
    }
  } catch (e: any) {
    // if there is an error, we stop everything since the results are no longer guaranted
    logError('sendMailForDeviceUpdateTask', e);
  }
};
