#!/bin/bash
~/.npm-global/bin/yarn install
~/.npm-global/bin/yarn build
/usr/bin/node ./scripts/migrateUp.js
~/.npm-global/bin/pm2 stop upsignon-pro-server
~/.npm-global/bin/pm2 start ecosystem.config.js --update-env
