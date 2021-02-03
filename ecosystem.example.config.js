const env = {
  DB_USER: 'db-administrator',
  DB_PASS: 'db-password',
  DB_NAME: 'upsignonpro',
  DB_HOST: 'localhost',
  DB_PORT: 5432,
  NODE_ENV: 'production',
  SERVER_PORT: 3000,
  CERTIFICATE_DIR_PATH: '',
};

module.exports = {
  apps: [
    {
      name: 'server',
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
      name: 'migrate-down',
      script: './scripts/migrateDown.js',
      env,
      error_file: './logs/db-error.log',
      out_file: './logs/db-output.log',
      autorestart: false,
    },
    {
      name: 'migrate',
      script: './scripts/migrateUp.js',
      env,
      error_file: './logs/db-error.log',
      out_file: './logs/db-output.log',
      autorestart: false,
    },
  ],
};
