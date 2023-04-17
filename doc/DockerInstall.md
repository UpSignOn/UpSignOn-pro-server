# Deploying the UpSignOn PRO server

```
sudo apt-get update
sudo apt-get install curl
curl -fsSL get.docker.com -o get-docker.sh && sh get-docker.sh
```


# using certbot
```
docker compose run --rm upsignon-pro-certbot certonly --agree-tos -m gireg.dekerdanet@upsignon.eu -n --webroot --webroot-path /var/www/certbot -d test.upsignon.eu --cert-name upsignonpro

docker compose run --rm upsignon-pro-certbot certonly --agree-tos -m gireg.dekerdanet@upsignon.eu -n --webroot --webroot-path /var/www/certbot -d test.upsignon.eu --cert-name upsignonpro --test-cert && docker compose exec upsignon-pro-nginx nginx -s reload


docker compose run --rm upsignon-certbot renew
```

docker compose exec upsignon-nginx nginx -s reload

# Docker clean up
```
docker system prune
```


# script de maj
```
docker compose pull
docker image prune -f
docker compose up
```