import nodemailer from 'nodemailer';
import { db } from './db';

type EmailConfig = {
  EMAIL_HOST: string;
  EMAIL_PORT: number;
  EMAIL_PASS?: null | string;
  EMAIL_USER: string;
  EMAIL_ALLOW_INVALID_CERTIFICATE?: boolean;
};

export const getEmailConfig = async (): Promise<EmailConfig> => {
  const emailConfReq = await db.query("SELECT value FROM settings WHERE key = 'EMAIL_CONFIG'");
  if (emailConfReq.rowCount !== 1) {
    throw new Error('missing email config');
  }
  const emailConfig = emailConfReq.rows[0].value;
  return emailConfig;
};

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const getMailTransporter = (
  emailConfig: EmailConfig,
  options: {
    debug: boolean;
    logger?: boolean;
    connectionTimeout?: number;
  },
) => {
  const transportOptions = {
    host: emailConfig.EMAIL_HOST,
    port: emailConfig.EMAIL_PORT,
    secure: emailConfig.EMAIL_PORT === 465,
    tls: {},
    ...options,
  };
  if (emailConfig.EMAIL_PASS) {
    // @ts-ignore
    transportOptions.auth = {
      user: emailConfig.EMAIL_USER,
      pass: emailConfig.EMAIL_PASS,
    };
  }
  if (options.debug) {
    transportOptions.tls = {
      ...transportOptions.tls,
      enableTrace: true,
    };
  }
  if (emailConfig.EMAIL_ALLOW_INVALID_CERTIFICATE) {
    transportOptions.tls = {
      ...transportOptions.tls,
      rejectUnauthorized: false,
    };
  }
  const transporter = nodemailer.createTransport(transportOptions);
  return transporter;
};
