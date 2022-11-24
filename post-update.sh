#!/bin/bash
yarn install
yarn build
node ./scripts/migrateUp.js
pm2 stop upsignon-pro-server
pm2 start ecosystem.config.js --update-env
