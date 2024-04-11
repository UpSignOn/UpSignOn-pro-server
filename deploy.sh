if [ -z "$1" ]
  then
    echo "Usage: deploy.sh <commit message>"
    exit 1;
fi
git checkout prod-source
yarn build
cd ../production-pro-server
git fetch --all
git reset --hard
git checkout production
rm -rf ./compiled
rm -rf ./doc
rm -rf ./scripts
cp -r ../upsignon-pro-server/compiled ./compiled
cp -r ../upsignon-pro-server/doc ./doc
cp -r ../upsignon-pro-server/scripts ./scripts
cp ../upsignon-pro-server/dot-env-template ./dot-env-template
cp ../upsignon-pro-server/ecosystem.config.js ./ecosystem.config.js
cp ../upsignon-pro-server/prod-package.json ./package.json
cp ../upsignon-pro-server/README.md ./README.md
cp ../upsignon-pro-server/update.sh ./update.sh
cp ../upsignon-pro-server/post-update.sh ./post-update.sh
git add .
git commit -m "$1"
git push
