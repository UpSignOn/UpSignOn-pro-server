# Avant de commencer

- Envoyez un email à giregk@upsignon.eu en indiquant
  - l'url sur laquelle votre serveur UpSignOn pro sera accessible (ex https://upsignon.domaine.fr)
  - l'url sur laquelle votre serveur d'administration forest-admin sera accessible (ex: https://admin-upsignon.domaine.fr)
  - l'adresse email d'une personne qui sera administrateur du projet Forest Admin

# Installation de la base de données

- installer la version LTS de PostgresSQL (https://www.postgresql.org/download/) (toutes les versions devraient fonctionner)
- création d'un utilisateur dédié, par exemple 'upsignonpro' (sur linux: `createuser upsignonpro --password` (ne pas copier le mot de passe, il faut l'écrire))
- création de la base de données PostgreSQL, avec verrouillage par mot de passe, pour l'utilisateur 'upsignonpro' (sur linux: `createdb upsignonpro -O upsignonpro`)
  - NB: cette base de données sera provisionnée dans l'étape suivante

Dans la suite, les variables d'environnement suivantes feront référence à la configuration de la base de données

- DB_USER: nom de l'utilisateur propriétaire de la base de données
- DB_PASS: mot de passe d'accès à la base de données
- DB_NAME: nom de la base de données
- DB_HOST: nom d'hôte du serveur sur lequel est servi la base de données
- DB_PORT: port sur lequel est servi la base de données

# Installation du serveur UpSignOn PRO

- ce serveur va envoyer des emails à vos utilisateurs. Vous devez donc définir une adresse email d'envoi pour ces emails. La configuration de cette adresse email sera stockée dans les variables d'environnement suivantes

  - EMAIL_HOST: nom du serveur smtp permettant d'envoyer des mails de validation aux utilisateurs
  - EMAIL_PORT: '587' a priori (dépend de votre configuration)
  - EMAIL_USER: adresse email à partir de laquelle seront envoyés les mails de validation
  - EMAIL_PASS: mot de passe pour cette adresse email

- installer Node.js (https://nodejs.org/en/download/package-manager/) (toutes les versions > v12 devraient fonctionner)
- installer yarn `npm install --global yarn`
- installer git (https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)
  - NB, il n'est pas nécessaire de définir un utilisateur github
- (optionnel) si vous souhaitez utiliser pm2 comme gestionnaire de processus (redémarrage automatique du serveur, gestion de plusieurs instances), installer pm2 `npm install pm2 -g`
- (optionnel) pour bénéficier de l'autocompletion des commandes pm2 `pm2 completion install`

- installez un certificat SSL pour que la connection entre le reverse proxy et le serveur local soit sécurisée. Les chemins d'accès à ce certificat seront stockés dans les variables d'environnement suivantes:

  - SSL_CERTIFICATE_KEY_PATH: chemin absolu vers le fichier .key (ou .pem) utilisé pour la communication SSL locale
  - SSL_CERTIFICATE_CRT_PATH: chemin absolu vers le fichier .crt (ou .pem) utilisé pour la communication SSL locale

- clone du repo `git clone --branch production https://github.com/UpSignOn/UpSignOn-pro-server.git <DESTINATION_DIRECTORY>`
- dans le dossier <DESTINATION_DIRECTORY>

  - installez les nodes modules `yarn install`
  - compilez le projet `yarn build`
  - si vous souhaitez utiliser pm2, dupliquez le fichier ecosystem vers par exemple `ecosystem.production.config.js`

    - éditez ce fichier pour y définir les variables d'environnement nécessaires
      - DB_USER
      - DB_PASS
      - DB_NAME
      - DB_HOST
      - DB_PORT
      - NODE_ENV: doit être 'production'
      - API_PUBLIC_HOSTNAME: nom d'hôte public sur lequel l'application pourra communiquer avec votre serveur UpSignOn PRO (sans 'https://', peut contenir un chemin)
      - SERVER_PORT: port utilisé pour le serveur local
      - SSL_CERTIFICATE_KEY_PATH
      - SSL_CERTIFICATE_CRT_PATH
      - EMAIL_HOST
      - EMAIL_PORT
      - EMAIL_USER
      - EMAIL_PASS
      - DISPLAY_NAME_IN_APP: le nom qui sera affiché aux utilisateurs dans l'application
    - vous pouvez également choisir les chemins où seront stockés les logs
    - une fois que toutes les variables d'environnement sont correctement définies, exécutez les commandes suivantes

      - provisionning de la base de données : `pm2 start ecosystem.production.config.js --only upsignon-pro-db-migrate`
      - démarrage du serveur : `pm2 startOrReload ecosystem.production.config.js --only upsignon-pro-server`
      - NB: le script `pm2 start ecosystem.production.config.js --only upsignon-pro-db-migrate-down` ne sera a priori jamais utilisé, il permet d'annuler les dernières modifications apportées à la structure de la base de données.

  - si vous ne voulez pas utiliser pm2, assurez-vous que toutes les variables d'environnement citées sont correctement définies puis exécutez les deux commandes suivantes
    - provisioning de la base de données: `node ./scripts/migrateUp.js`
    - démarrage du serveur: `node ./compiled/server.js`

# Configuration du reverse proxy

Voici par exemple une configuration possible avec Nginx

```
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
server_tokens off;

add_header X-Frame-Options "DENY";
add_header X-XSS-Protection "1; mode=block";
add_header X-DNS-Prefetch-Control "off";
add_header X-Download-Options "noopen";
add_header X-Content-Type-Options "nosniff";
add_header X-Permitted-Cross-Domain-Policies "none";

ssl_certificate /etc/certificate/myDomainCertificateSignedByTrustedAuthority.cer;
ssl_certificate_key /etc/certificate/myDomainCertificatePrivateKey.key;
ssl_ciphers "EECDH+ECDSA+AESGCM EECDH+aRSA+AESGCM EECDH+ECDSA+SHA384 EECDH+ECDSA+SHA256 EECDH+aRSA+SHA384 EECDH+aRSA+SHA256 EECDH+aRSA+RC4 EECDH EDH+aRSA HIGH !RC4 !aNULL !eNULL !LOW !3DES !MD5 !EXP !PSK !SRP !DSS";

server {
  listen 80;
  listen [::]:80;
  return 301 https://$host$request_uri;
}
server {
  listen 443 ssl http2;
  listen [::]:443 ssl http2;
  server_name upsignon.my-domain.fr;
  proxy_ssl_verify off;
  root /home/b-upsignon/server/public/;

  location / {
    proxy_pass https://localhost:3000;
  }
  if ($request_method !~ ^(GET|HEAD|POST)$ )
  {
    return 405;
  }
}
```

# Dernières configurations

- Depuis votre interface d'administration Forest Admin, ajoutez les adresses email autorisées à créer un environnement PRO.
  - NB : déclarer '\*@mon-domaine.fr' aura pour effet d'autoriser toutes les adresses de ce domaine
- Depuis votre interface d'administration Forest Admin, vous pouvez ajouter les urls les plus classiques que saisiront vos agents (cette liste n'empêche pas l'enregistrement de mot de passe pour d'autres url, elle sera simplement affichée comme une liste de suggestions). Nous vous conseillons d'en mettre autant que possible pour faciliter l'onboarding des agents.

# Lancement auprès des utilisateurs

Pour configurer leur espace PRO, vos utilisateurs vont devoir ouvrir le lien suivant
"https://upsignon.eu/pro-setup?url=<VOTRE_URL_ENCODÉE>" où
<VOTRE_URL_ENCODÉE> = le résultat en javascript de `encodeURIComponent('https://upsignon.my-domain.fr')` soit "https%3A%2F%2Fupsignon.my-domain.fr"

Ce lien va les rediriger vers une page web qui ouvrira l'application UpSignOn sur la page de configuration.

Un QR code est aussi un bon moyen de transmettre ce lien. D'ailleurs, l'application fournit un scanneur de QR code intégré pour simplifier ce mécanisme.

# Mise à jour du serveur

- `git pull`
- `yarn build`
- avec pm2
  - mise à jour de la base de données : `pm2 start ecosystem.production.config.js --only upsignon-pro-db-migrate`
  - redémarrage du serveur : `pm2 startOrReload ecosystem.production.config.js --only upsignon-pro-server`
- sans pm2 :
  - mise à jour de la base de données : `node ./scripts/migrateUp.js`
  - redémarrage du serveur : `node ./compiled/server.js`
