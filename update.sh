#!/bin/bash
if [[ "$USER" != "upsignonpro" && "$USER" != "upsignon" ]]; then
  echo "You need to run the update script as upsignonpro."
  exit 1
fi

git pull origin production --ff-only
yarn install
yarn build
node ./scripts/migrateUp.js
pm2 startOrReload ecosystem.config.js --only upsignon-pro-server
