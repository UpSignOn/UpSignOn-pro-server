git pull origin production --ff-only
yarn install
yarn build
node ./scripts/migrateUp.js
yarn restart
pm2 save
