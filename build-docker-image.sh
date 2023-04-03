docker image prune -f
yarn
yarn build
docker build --no-cache -t giregdekerdanet/upsignon-pro-server .