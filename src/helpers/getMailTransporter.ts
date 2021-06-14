import nodemailer from 'nodemailer';
import env from './env';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const getMailTransporter = (options: {
  debug: boolean;
  logger?: boolean;
  connectionTimeout?: number;
}) => {
  const transportOptions = {
    host: env.EMAIL_HOST,
    port: env.EMAIL_PORT,
    secure: env.EMAIL_PORT === 465,
    auth: {
      user: env.EMAIL_USER,
      pass: env.EMAIL_PASS,
    },
    ...options,
  };
  const transporter = nodemailer.createTransport(transportOptions);
  return transporter;
};
