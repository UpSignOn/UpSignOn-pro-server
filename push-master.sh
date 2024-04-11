if [ -z "$1" ]
  then
    echo "Usage: push-master.sh <commit message>"
    exit 1;
fi
git stash -u
git checkout master
yarn build
cd ../production-pro-server
git fetch --all
git reset --hard
git checkout master-build
rm -rf ./compiled
rm -rf ./doc
rm -rf ./scripts
rm -rf ./migrations
cp -r ../upsignon-pro-server/compiled ./compiled
cp -r ../upsignon-pro-server/doc ./doc
cp -r ../upsignon-pro-server/scripts ./scripts
cp -r ../upsignon-pro-server/migrations ./migrations
cp ../upsignon-pro-server/dot-env-template ./dot-env-template
cp ../upsignon-pro-server/ecosystem.config.js ./ecosystem.config.js
cp ../upsignon-pro-server/prod-package.json ./package.json
cp ../upsignon-pro-server/README.md ./README.md
cp ../upsignon-pro-server/update.sh ./update.sh
cp ../upsignon-pro-server/post-update.sh ./post-update.sh
cp ../upsignon-pro-server/build.gitignore ./.gitignore
git add .
git commit -m "$1"
git push
