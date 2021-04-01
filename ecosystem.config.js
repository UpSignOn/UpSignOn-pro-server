/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

module.exports = {
  apps: [
    {
      name: 'upsignon-pro-server',
      script: './compiled/server.js',
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
      error_file: './logs/db-error.log',
      out_file: './logs/db-output.log',
      autorestart: false,
    },
    {
      name: 'upsignon-pro-db-migrate',
      script: './scripts/migrateUp.js',
      error_file: './logs/db-error.log',
      out_file: './logs/db-output.log',
      autorestart: false,
    },
  ],
};
