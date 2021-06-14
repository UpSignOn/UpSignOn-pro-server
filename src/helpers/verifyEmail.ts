import { getMailTransporter } from './getMailTransporter';

export const verifyEmail = (): void => {
  const transporter = getMailTransporter({ debug: true });
  transporter.verify(function (error) {
    if (error) {
      console.log('Email configuration is not correct.');
      console.log(error);
      console.error(error);
    } else {
      console.log('Email configuration seems correct.');
    }
  });
};
