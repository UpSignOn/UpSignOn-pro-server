#!/bin/bash
if [[ "$USER" != "upsignonpro" && "$USER" != "upsignon" ]]; then
  echo "You need to run the update script as upsignonpro."
  exit 1
fi

git pull origin production --ff-only
yarn install
yarn build
node ./scripts/migrateUp.js
pm2 kill upsignon-pro-server
pm2 start ecosystem.config.js --only upsignon-pro-server
