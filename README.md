# Avant de commencer

- Envoyez un email à giregk@upsignon.eu en indiquant

  - l'url sur laquelle votre serveur UpSignOn pro sera accessible (ex https://upsignon.domaine.fr)
  - l'url sur laquelle votre serveur d'administration forest-admin sera accessible (ex: https://admin-upsignon.domaine.fr, ou https://upsignon.domaine.fr/forest-admin)
  - l'adresse email d'une personne qui sera administrateur du projet Forest Admin (le panneau d'administration)
    A réception de ce mail, nous vous préparerons un projet forest-admin pour que vous n'ayiez pas à le faire.

- Ressources minimales estimées
  - CPU : 2vcore
  - RAM : 512Mo minimum, 2Go pour un nombre d'utilisateurs plus importants (or système d'exploitation, donc compter peut-être 4Go si windows server, plus gourmand qu'un linux)
  - HD ou SSD : compter environ 3Go pour le système d'exploitation, les packages d'installation et le code, puis 100ko par utilisateur pour la base de données (soit 100mo pour 1000 utilisateurs), puis quelques Go pour stocker les logs (selon la durée de conservation)

# Schéma d'architecture générale

![](./doc/integrationSchemeGeneral.png)

Voici deux implémentations possibles, sachant qu'il peut y avoir des variantes en fonction de vos habitudes et de vos standards.

## Déploiement type 1

Le plus simple.

![](./doc/integrationScheme1.png)

## Déploiement type 2

- plus complexe
- séparation des processus dans des VM différentes
- permet notamment si vous le souhaitez de mettre le serveur Forest Admin dans une zone qui n'est pas accessible depuis l'extérieur de votre réseau puisque seuls vos administrateurs sont sensés être autorisés à s'y connecter de toute façon (ce qui pourrait aussi être fait dans le schéma 1 avec des proxys)

![](./doc/integrationScheme2.png)

# Installation de la base de données

Vous pouvez installer la base de données postgreSQL selon vos propres procédures si vous maîtrisez bien le sujet.

1. installation de postgresql

- suivez le tutoriel correspondant à votre système sur https://www.postgresql.org/download/ (toutes les versions de postgresql devraient fonctionner)
- sur linux, saisissez `sudo -i -u postgres` pour vous connecter en tant qu'utilisateur postgres
  - la commande `psql` devrait alors fonctioner et vous faire entrer dans l'interface en ligne de commande de postgresql

2. création de la base de données pour UpSignOn PRO

Voici une procédure éprouvée pour les environnements Linux (testé sur Debian 10).
Cette procédure configure un utilisateur linux qui sera le propriétaire de la base de données et du serveur.

- Vous voudrez sans doute créer un utilisateur linux pour exécuter le serveur UpSignOn PRO dans un environnement à privilèges limités.
  Pour créer un utilisateur appelé 'upsignonpro', utilisez la commande : `sudo adduser upsignonpro`

- pour créer la base de données et pour qu'elle soit accessible par l'utilisateur linux que nous venons de créer:
  - connection en tant qu'utilisateur postgres: `su - postgres`
  - créons un rôle PostgreSQL appelé 'upsignonpro': `createuser upsignonpro`
  - créons la base de données `createdb upsignonpro -O upsignonpro` (NB: cette base de données sera provisionnée dans l'étape suivante)
  - ajoutons un mot de passe au rôle 'upsignonpro': `psql` puis dans l'invite PostgreSQL, `\password upsignonpro`
- à partir de là, vous devriez pouvoir vous connecter à votre base de données en tant qu'utilisateur 'upsignonpro' (`su - upsignonpro`) en tapant la commande `psql upsignonpro`

Dans la suite, les variables d'environnement suivantes feront référence à la configuration de la base de données

- DB_USER: nom de l'utilisateur propriétaire de la base de données (ici 'upsignonpro')
- DB_PASS: mot de passe d'accès à la base de données (celui du role 'upsignonpro')
- DB_NAME: nom de la base de données (ici 'upsignonpro')
- DB_HOST: nom d'hôte du serveur sur lequel est servi la base de données ('localhost')
- DB_PORT: port sur lequel est servi la base de données ('5432')

# Installation du serveur UpSignOn PRO

Ce qui suit doit être exécuté en tant qu'utilisateur "upsignonpro" (`su - upsignonpro` ou celui que vous avez choisi) pour que le serveur UpSignOn Pro soit exécuté dans un environnement à privilèges limités.

- ce serveur va envoyer des emails à vos utilisateurs. Vous devez donc définir une adresse email d'envoi pour ces emails. La configuration de cette adresse email sera stockée dans les variables d'environnement suivantes

  - EMAIL_HOST: nom du serveur smtp permettant d'envoyer des mails de validation aux utilisateurs
  - EMAIL_PORT: '587' a priori (dépend de votre configuration)
  - EMAIL_USER: adresse email à partir de laquelle seront envoyés les mails de validation
  - EMAIL_PASS: mot de passe pour cette adresse email

- installer Node.js (https://nodejs.org/en/download/package-manager/) (testé en v12 et v15)

- installer yarn `npm install --global yarn`

- installer git (https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)

  - NB, il n'est pas nécessaire de définir un utilisateur github

- (optionnel) si vous souhaitez utiliser pm2 comme gestionnaire de processus (redémarrage automatique du serveur, gestion de plusieurs instances, gestion des logs), installez pm2 `npm install pm2 -g`.

  - NB: la capacité de redémarrage automatique en cas de crash est incluse par défaut avec pm2, vous n'avez rien de plus à configurer.

- (optionnel) vous pouvez installer un certificat SSL pour que la connection entre le reverse proxy et le serveur local soit sécurisée. Les chemins d'accès à ce certificat seront stockés dans les variables d'environnement suivantes:

  - SSL_CERTIFICATE_KEY_PATH: chemin absolu vers le fichier .key (ou .pem) utilisé pour la communication SSL locale
  - SSL_CERTIFICATE_CRT_PATH: chemin absolu vers le fichier .crt (ou .pem) utilisé pour la communication SSL locale

  - NB : l'utilisateur linux propriétaire du serveur doit pouvoir accéder à ces fichiers en lecture. N'oubliez pas de configurer les droits d'accès à ces fichiers correctement.
  - si ces deux variables d'environnement ne sont pas définies, le serveur local fonctionnera en http.

- clone du repo `git clone --branch production https://github.com/UpSignOn/UpSignOn-pro-server.git <DESTINATION_DIRECTORY>`
- dans le dossier <DESTINATION_DIRECTORY>

  - installez les nodes modules `yarn install`
  - compilez le projet `yarn build`
  - créez le fichier `.env` : `cp dot-env-example .env` (attention, le nom de ce fichier doit être exactement `.env`)
  - dans le fichier `.env`, définissez toutes vos variables d'environnement.
    - DB_USER
    - DB_PASS
    - DB_NAME
    - DB_HOST
    - DB_PORT
    - NODE_ENV: doit être 'production'
    - SERVER_PORT: port utilisé pour le serveur local
    - SSL_CERTIFICATE_KEY_PATH (optionnel)
    - SSL_CERTIFICATE_CRT_PATH (optionnel)
    - EMAIL_HOST
    - EMAIL_PORT
    - EMAIL_USER
    - EMAIL_PASS
    - API_PUBLIC_HOSTNAME: nom d'hôte public sur lequel l'application pourra communiquer avec votre serveur UpSignOn PRO (sans 'https://', peut contenir un chemin)
    - DISPLAY_NAME_IN_APP: le nom qui sera affiché aux utilisateurs dans l'application

# Provisionning de la base de données

- `node ./scripts/migrateUp.js`

  - vous pouvez vérifier que tout s'est bien passé en vous connectant à votre base de données (`psql upsignonpro`) puis en tapant `\d` pour afficher toutes les tables. Le résultat ne doit pas être vide.
  - en cas d'erreur de connexion, vous pouvez tester via la commande
    ```
    psql -h localhost -U upsignonpro -p 5432 upsignonpro
    ```

# Démarrage du serveur

- option 1 avec pm2 : `pm2 start ecosystem.config.js --only upsignon-pro-server`
- option 2 sans pm2 : `node ./compiled/server.js`

# Configuration d'un reverse proxy

Voici par exemple une configuration possible avec Nginx

- Pour installer Nginx : `apt install nginx`
- Vous aurez besoin d'un certificat et d'une clé privée pour votre sous-domaine

Dans /etc/nginx/sites-enabled/upsignon

<details>
<summary>Example de configuration Nginx</summary>

Pensez à bien modifier les valeurs sous les `# TODO`

Dans le fichier `/etc/nginx/sites-enabled/upsignonpro`

<p>

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

# TODO
ssl_certificate /etc/certificate/myDomainCertificateSignedByTrustedAuthority.cer;
# TODO
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
  # TODO
  server_name upsignon.domaine.fr;
  proxy_ssl_verify off;

  location / {
    # TODO (choix entre http et https & choix du port)
    proxy_pass http://localhost:3000;
  }
  if ($request_method !~ ^(GET|HEAD|POST)$ )
  {
    return 405;
  }
}
```

</p>

NB, si vous avez choisi de configurer un certificat SSL pour le serveur local, remplacez `proxy_pass http://localhost:3000;` par `proxy_pass https://localhost:3000;`

</details>

- Redémarrer Nginx

```
systemctl restart nginx
```

# Installation d'un serveur d'administration Forest-Admin

Ceci installera un deuxième serveur, indépendant du serveur UpSignOn PRO, qui vous donnera accès à une interface d'administration ergonomique de la base de données. Ce serveur ne sera utilisé que par vos administrateurs IT.

- Suivez la documentation d'installation ici : https://github.com/UpSignOn/UpSignOn-pro-forest-admin

# Dernières configurations

- Depuis votre interface d'administration Forest Admin, ajoutez les adresses email autorisées à créer un environnement PRO.
  - NB : déclarer '\*@mon-domaine.fr' aura pour effet d'autoriser toutes les adresses de ce domaine
- Depuis votre interface d'administration Forest Admin, vous pouvez ajouter les urls les plus classiques que saisiront vos agents (cette liste n'empêche pas l'enregistrement de mot de passe pour d'autres url, elle sera simplement affichée comme une liste de suggestions). Nous vous conseillons d'en mettre autant que possible pour faciliter l'onboarding des agents.
- Par défaut, toute demande de réinitialisation de mot de passe doit être acceptée manuellement par un administrateur. (Ceci permet d'éviter que quelqu'un ayant réussi à voler un téléphone pro puisse en toute autonomie réinitialiser le mot de passe UpSignOn de l'utilisateur).
  - pour autoriser un utilisateur à réinitialiser son mot de passe, rendez-vous sur Forest-Admin, table "Password Reset Requests", sélectionnez la demande correspondant à l'utilisateur en question, puis utilisez le bouton Action en haut à droite. Ceci enverra un email à l'utilisateur pour qu'il puisse réinitialiser son mot de passe.
  - vous pouvez si vous le souhaitez désactiver la vérification manuelle et laisser le système valider automatiquement toute demande de réinitialisation de mot de passe en mettant le paramètre DISABLE_MANUAL_VALIDATION_FOR_PASSWORD_FORGOTTEN à true dans la table "Settings"

# Lancement auprès des utilisateurs

Pour configurer leur espace PRO, vos utilisateurs vont devoir ouvrir le lien suivant "https://upsignon.eu/pro-setup?url=<VOTRE_URL_ENCODÉE>" où <VOTRE_URL_ENCODÉE> = le résultat en javascript de `encodeURIComponent('https://upsignon.my-domain.fr')` soit "https%3A%2F%2Fupsignon.my-domain.fr" (vous pouvez facilement utiliser votre console javascript dans votre navigateur pour obtenir le résultat).

Ce lien va les rediriger vers une page web qui ouvrira l'application UpSignOn sur la page de configuration.

Un QR code est aussi un bon moyen de transmettre ce lien. D'ailleurs, l'application fournit un scanneur de QR code intégré pour simplifier ce mécanisme.

# Mise à jour du serveur

- `git pull`
- `yarn` (pour mettre à jour les dépendances si besoin)
- `yarn build`
- mise à jour de la base de données : `node ./scripts/migrateUp.js`
- redémarrage du serveur :
  - avec pm2 : `pm2 reload ecosystem.config.js --only upsignon-pro-server`
  - sans pm2 : `node ./compiled/server.js`
