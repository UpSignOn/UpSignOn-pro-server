git pull origin production --ff-only
yarn install
rm -rf compiled
tsc -p .
node ./scripts/migrateUp.js
pm2 del upsignon-pro-server
pm2 startOrReload ecosystem.config.js --only upsignon-pro-server
