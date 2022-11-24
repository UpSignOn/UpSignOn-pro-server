#!/bin/bash
git pull origin production --ff-only
yarn install
yarn build
node ./scripts/migrateUp.js
pm2 stop upsignon-pro-server
pm2 start ecosystem.config.js
