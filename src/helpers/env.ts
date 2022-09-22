const {
  DB_USER,
  DB_PASS,
  DB_NAME,
  DB_HOST,
  DB_PORT,
  NODE_ENV,
  API_PUBLIC_HOSTNAME,
  SESSION_SECRET,
  SERVER_PORT,
  SSL_CERTIFICATE_KEY_PATH,
  SSL_CERTIFICATE_CRT_PATH,
  HTTP_PROXY,
} = process.env;

export default {
  IS_PRODUCTION: NODE_ENV !== 'development',
  DB_HOST,
  DB_PORT: DB_PORT ? Number.parseInt(DB_PORT) : 5432,
  DB_USER,
  DB_NAME,
  DB_PASS,
  SERVER_PORT: SERVER_PORT ? Number.parseInt(SERVER_PORT) : 3000,
  API_PUBLIC_HOSTNAME: API_PUBLIC_HOSTNAME || '',
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  SESSION_SECRET: SESSION_SECRET || require('crypto').randomBytes(64).toString('hex'),
  SSL_CERTIFICATE_KEY_PATH: SSL_CERTIFICATE_KEY_PATH || '',
  SSL_CERTIFICATE_CRT_PATH: SSL_CERTIFICATE_CRT_PATH || '',
  HTTP_PROXY,
};
