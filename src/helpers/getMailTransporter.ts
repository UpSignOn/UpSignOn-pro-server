import nodemailer from 'nodemailer';
import env from './env';

export const getMailTransporter = (options: { debug: boolean }) => {
  const transportOptions = {
    host: env.EMAIL_HOST,
    port: env.EMAIL_PORT,
    secure: env.EMAIL_PORT === 465,
    auth: {
      user: env.EMAIL_USER,
      pass: env.EMAIL_PASS,
    },
    debug: options.debug,
  };
  const transporter = nodemailer.createTransport(transportOptions);
  return transporter;
};
