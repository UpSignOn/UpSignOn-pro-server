import { getMailTransporter } from './getMailTransporter';
import { logError, logInfo } from './logger';

export const verifyEmail = (): void => {
  const transporter = getMailTransporter({ debug: true, logger: true, connectionTimeout: 30000 });
  logInfo('Start checking configuration email (wait 30 seconds to see the error)...');
  transporter.verify(function (error) {
    if (error) {
      logInfo('...Email configuration is not correct.');
      logInfo(error);
      logError(error);
    } else {
      logInfo('...Email configuration seems correct.');
    }
  });
};
