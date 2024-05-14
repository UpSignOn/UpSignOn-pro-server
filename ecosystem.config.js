/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');

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
        NODE_ENV: 'production',
      },
    },
  ],
};
