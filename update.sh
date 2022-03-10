git pull origin production --ff-only
yarn install
yarn build
node ./scripts/migrateUp.js
pm2 startOrReload ecosystem.config.js --only upsignon-pro-server
