/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');
const dotEnvPath = path.join(__dirname, '.env');
require('dotenv').config({ path: dotEnvPath });

module.exports = {
  apps: [
    {
      name: 'upsignon-pro-server',
      script: path.join(__dirname, './compiled/server.js'),
      instances: 1,
      exec_model: 'fork',
      error_file: path.join(__dirname, './logs/server-error.log'),
      out_file: path.join(__dirname, './logs/server-output.log'),
      combine_logs: true,
      kill_timeout: 3000,
      source_map_support: true,
      autorestart: true,
      min_uptime: 1000,
      env: {
        // prevent pm2 override of NODE_ENV
        NODE_ENV: process.env.NODE_ENV,
      },
    },
  ],
};
