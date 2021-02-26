const env = {
  DB_USER: 'db-administrator',
  DB_PASS: 'db-password',
  DB_NAME: 'upsignonpro',
  DB_HOST: 'localhost',
  DB_PORT: '5432',
  NODE_ENV: 'production',
  API_PUBLIC_HOSTNAME: 'monptitshop.eu',
  SERVER_PORT: '3000',
  SSL_CERTIFICATE_KEY_PATH: '',
  SSL_CERTIFICATE_CRT_PATH: '',
  EMAIL_HOST: 'smtp.domain.fr',
  EMAIL_PORT: '587',
  EMAIL_USER: 'user@domain.fr',
  EMAIL_PASS: 'password',
};

module.exports = {
  apps: [
    {
      name: 'upsignon-pro-server',
      script: './compiled/server.js',
      env,
      instances: 1,
      exec_model: 'fork',
      error_file: './logs/server-error.log',
      out_file: './logs/server-output.log',
      combine_logs: true,
      kill_timeout: 3000,
      source_map_support: true,
    },
    {
      name: 'upsignon-pro-db-migrate-down',
      script: './scripts/migrateDown.js',
      env,
      error_file: './logs/db-error.log',
      out_file: './logs/db-output.log',
      autorestart: false,
    },
    {
      name: 'upsignon-pro-db-migrate',
      script: './scripts/migrateUp.js',
      env,
      error_file: './logs/db-error.log',
      out_file: './logs/db-output.log',
      autorestart: false,
    },
  ],
};
