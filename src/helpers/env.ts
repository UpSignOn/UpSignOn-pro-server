const {
  DB_USER,
  DB_PASS,
  DB_NAME,
  DB_HOST,
  DB_PORT,
  NODE_ENV,
  SERVER_PORT,
  CERTIFICATE_DIR_PATH,
} = process.env;

export default {
  IS_PRODUCTION: NODE_ENV === 'production',
  DB_HOST,
  DB_PORT: DB_PORT ? Number.parseInt(DB_PORT): 5432,
  DB_USER,
  DB_NAME,
  DB_PASS,
  SERVER_PORT: SERVER_PORT ? Number.parseInt(SERVER_PORT): 3000,
  CERTIFICATE_DIR_PATH,
};
