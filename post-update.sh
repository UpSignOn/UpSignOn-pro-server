#!/bin/bash
/home/upsignonpro/.npm-global/bin/yarn install
/home/upsignonpro/.npm-global/bin/yarn build
/usr/bin/node ./scripts/migrateUp.js
/home/upsignonpro/.npm-global/bin/pm2 stop upsignon-pro-server
/home/upsignonpro/.npm-global/bin/pm2 start ecosystem.config.js --update-env
