import { getMailTransporter } from './getMailTransporter';

export const verifyEmail = (): void => {
  const transporter = getMailTransporter({ debug: true, logger: true, connectionTimeout: 30000 });
  console.log('Start checking configuration email (wait 30 seconds to see the error)...');
  transporter.verify(function (error) {
    if (error) {
      console.log('...Email configuration is not correct.');
      console.log(error);
      console.error(error);
    } else {
      console.log('...Email configuration seems correct.');
    }
  });
};
