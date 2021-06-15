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
    tls: {},
    ...options,
  };
  if (options.debug) {
    transportOptions.tls = {
      ...transportOptions.tls,
      enableTrace: true,
    };
  }
  if (env.EMAIL_ALLOW_INVALID_CERTIFICATE) {
    transportOptions.tls = {
      ...transportOptions.tls,
      rejectUnauthorized: false,
    };
  }
  const transporter = nodemailer.createTransport(transportOptions);
  return transporter;
};
