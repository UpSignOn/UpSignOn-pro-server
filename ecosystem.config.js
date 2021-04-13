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
      autorestart: true,
    },
  ],
};
