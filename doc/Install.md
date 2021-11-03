# Schéma d'architecture

Vous allez devoir installer une base de données PostgreSQL et deux serveurs applicatifs (3 processus). Notez que ces 3 processus n'ont pas besoin de s'exécuter sur la même machine.

![](/doc/integrationSchemeGeneral.png)

## Architecture type 1 (Architecture standard, la plus simple)

Nous recommandons cette architecture pour simplifier l'installation et la maintenance.

![](/doc/integrationScheme1.png)

## Architecture type 2

Ce type d'architecture sera notamment adapté pour les cas où vous voulez ajouter une couche de protection supplémentaire sur le serveur d'administration en le rendant accessible uniquement depuis votre réseau d'entreprise interne afin de limiter la surface d'attaque possible.

Notez cependant que le serveur UpSignOn PRO doit rester accessible depuis n'importe où pour que le client lourd puisse s'y connecter.
![](/doc/integrationScheme2.png)

## Ressources nécessaires estimées par serveur

- OS : Debian 10
- CPU : 2vcore
- RAM : 512Mo minimum, 2Go pour un nombre d'utilisateurs plus importants (or système d'exploitation, donc compter peut-être 4Go si windows server, plus gourmand qu'un linux)
- HD ou SSD : compter environ 3Go pour le système d'exploitation, les packages d'installation et le code + 6Go de logs par serveur maximum. Soit, pour l'architecture 1, 15Go de HD/SSD (hors base de données) et dans l'architecture 2, 2 fois 9 Go de HD/SSD.

Serveur de base de données

- votre OS de prédilection
- CPU: 2vcore
- RAM 512Mo
- HD ou SD : compter environ 200ko par utilisateur, soit 100mo pour 500 utilisateurs.

## Tableau des flux

| Origine                  | Destination                                        | PORT       |
| ------------------------ | -------------------------------------------------- | ---------- |
| Client lourd             | Serveur UpSignOn PRO                               | 443        |
| Navigateur               | Serveur d'administration                           | 443        |
| Serveur UpSignOn PRO     | Base de données                                    | 5432       |
| Serveur d'administration | Base de données                                    | 5432       |
| Serveur UpSignOn PRO     | Serveur SMTP                                       | 587 ou 465 |
| Serveur d'administration | Serveur SMTP                                       | 587 ou 465 |
| Serveur UpSignOn PRO     | app.upsignon.eu                                    | 443        |
| Serveur UpSignOn PRO     | internet (pour l'installation et les mises à jour) | 443        |
| Serveur d'administration | internet (pour l'installation et les mises à jour) | 443        |

# Avant de commencer l'installation

## Configuration DNS

Choisissez les urls sur lequelles seront accessibles les deux serveurs, typiquement via un sous-domaine.

- l'url du serveur UpSignOn pro, par exemple https://upsignonpro.votre-domaine.fr

- l'url du serveur d'administration, par exemple https://upsignonpro.votre-domaine.fr/admin

## Certificat SSL

Assurez-vous de disposer d'un certificat SSL et de sa clé privée pour le (sous-)domaine que vous avez choisi

- ceci est **OBLIGATOIRE**
- les certificats wildcard sont autorisés
- **LES CERTIFICATS AUTOSIGNÉS NE FONCTIONNERONT PAS** sauf s'ils sont approuvés par toutes les machines de vos collaborateurs, mais ils restent déconseillés

## Serveur de mail

Assurez-vous de disposer d'une configuration pour l'envoi de mails

- serveur smtp (smtp.domaine.fr)
- port d'envoi (ex: 25, 587, 465)
- adresse email (ex: noreply@domaine.fr)
- mot de passe pour cette adresse email si nécessaire

## Déclarez-nous vos urls

Nous devons déclarer vos urls dans notre base de données pour qu'elles soit autorisées.

- l'URL de votre serveur UpSignOn PRO, https://upsignonpro.votre-domaine.fr, chemin y compris le cas échéant
- l'URL de votre serveur d'administration, https://upsignonpro.votre-domaine.fr/admin, chemin y compris le cas échéant

Envoyez-nous ces deux urls par email (giregk@upsignon.eu) **avant** de commencer l'installation pour ne pas perdre de temps.

# Installation de la base de données

1. installation de postgresql

Suivez les instructions correspondant à votre système sur https://www.postgresql.org/download/ (toutes les versions de postgresql devraient fonctionner, prenez la dernière version LTS).

Sur linux, saisissez ensuite `sudo -i -u postgres` pour vous connecter en tant qu'utilisateur postgres. La commande `psql` devrait alors fonctioner et vous faire entrer dans l'interface en ligne de commande de postgresql. Utilisez CTRL+D pour sortir de psql.

2. création de la base de données pour UpSignOn PRO
   La procédure qui suis a été écrite pour Debian 10.

Créez un utilisateur système upsignonpro : `sudo adduser upsignonpro`

Connectez-vous en tant qu'utilisateur postgres : `su - postgres`

Créons la base de données `createdb upsignonpro -O upsignonpro` (NB: cette base de données sera provisionnée dans l'étape suivante)

Ajoutons un mot de passe au rôle 'upsignonpro': `psql` puis dans l'invite PostgreSQL, `\password upsignonpro`

À partir de là, vous devriez pouvoir vous connecter à votre base de données en tant qu'utilisateur 'upsignonpro' (`su - upsignonpro`) en tapant la commande `psql upsignonpro`

Dans la suite, les variables d'environnement suivantes feront référence à la configuration de la base de données

- DB_USER: nom de l'utilisateur propriétaire de la base de données soit 'upsignonpro'
- DB_PASS: mot de passe d'accès à la base de données (celui du role 'upsignonpro')
- DB_NAME: nom de la base de données, soit 'upsignonpro'
- DB_HOST: nom d'hôte du serveur sur lequel est servi la base de données ('localhost')
- DB_PORT: port sur lequel est servi la base de données ('5432')

# Installation des serveurs

## Installation des outils

En tant que **root**,

- installer la dernière version de [Node.js](https://nodejs.org/en/download/package-manager/)

  ```
  curl -fsSL https://deb.nodesource.com/setup_current.x | bash -
  apt-get install -y nodejs
  ```

- installer pm2

  ```
  npm install pm2 -g
  ```

- installer [git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)
  ```
  apt install git-all
  ```
  - NB, il n'est pas nécessaire de définir un utilisateur github
- installation de Nginx (reverse proxy) `apt install nginx`
- ajoutez vos fichiers de certificats SSL, par exemple dans le dossier /etc/nginx/ssl
  - `mkdir /etc/nginx/ssl/`
  - fichier certificat: /etc/nginx/ssl/upsignonpro.cer
    > ATTENTION, il est primordial que ce fichier contienne toute la chaine de certification. Autrement l'application mobile refusera d'exécuter les requêtes vers votre serveur. Vous pouvez tester que c'est bien le cas grâce au site [https://whatsmychaincert.com](https://whatsmychaincert.com)
  - fichier clé privée: /etc/nginx/ssl/upsignonpro.key
  - `chmod 400 /etc/nginx/ssl/*`

En tant qu'utilisateur **upsignonpro**

```
su - upsignonpro

npm install --global yarn

pm2 install pm2-logrotate
```

Configurer votre proxy si besoin:

```
git config --global http.proxy http://username:password@host:port

git config --global http.sslVerify false

git config --global http.proxyAuthMethod 'basic'

npm config set proxy http://username:password@host:port

yarn config set proxy http://username:password@host:port
```

## Configuration de Nginx

En tant que root, créer le fichier /etc/nginx/sites-enabled/upsignonpro et ajoutez-y le contenu suivant:

```
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto https;

add_header X-Frame-Options "DENY";
add_header X-XSS-Protection "1; mode=block";
add_header X-DNS-Prefetch-Control "off";
add_header X-Download-Options "noopen";
add_header X-Content-Type-Options "nosniff";
add_header X-Permitted-Cross-Domain-Policies "none";

ssl_certificate /etc/nginx/ssl/upsignonpro.cer;
ssl_certificate_key /etc/nginx/ssl/upsignonpro.key;

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
  server_name upsignonpro.votre-domaine.fr;
  proxy_ssl_verify off;

  # TODO: keep this only for architecture 1 or the pro server of architecture 2
  location / {
    proxy_pass http://localhost:3000/;
  }
  # TODO: keep this only for architecture 1
  location /admin/ {
    proxy_pass http://localhost:3001/;
  }
  # TODO: keep this only for the admin server of architecture 2
  location / {
    proxy_pass http://localhost:3001/;
  }
}

```

> attention le '/' final dans 'http://localhost:3000/' et 'http://localhost:3001/' est important.

Une fois ce fichier créé, redémarrez Nginx

```
systemctl restart nginx
```

## Installation du serveur UpSignOn PRO et provisioning de la base de données

```bash
su - upsignonpro

cd

git clone --branch production https://github.com/UpSignOn/UpSignOn-pro-server.git upsignon-pro-server

cd upsignon-pro-server

yarn install

yarn build

cp dot-env-example .env
```

Éditez ensuite le fichier `.env` pour y définir toutes vos variables d'environnement.

Puis créez la structure de votre base de données

```bash
node ./scripts/migrateUp.js
```

Vous pouvez vérifier que tout s'est bien passé en vous connectant à votre base de données (`psql upsignonpro`) puis en tapant `\d` pour afficher toutes les tables. Le résultat ne doit pas être vide.

En cas d'erreur de connexion, vous pouvez tester via la commande

```bash
psql -h localhost -U upsignonpro -p 5432 upsignonpro
```

Démarrez ensuite le serveur

```
yarn start
pm2 save
```

Vous pouvez vérifier que la page https://upsignonpro.votre-domaine.fr affiche bien un message de succès.

Vous pouvez également tester que l'envoi des mails fonctionne bien en ouvrant la page https://upsignonpro.votre-domaine.fr/test-email?email=votre-email@votre-domaine.fr

## Installation du serveur d'administration

```bash
su - upsignonpro

cd

git clone --branch production https://github.com/UpSignOn/upsignon-pro-dashboard.git

cd upsignon-pro-dashboard
```

Vous pouvez voir qu'il y a deux dossiers dans ce projet.

DOSSIER FRONT

Créez un fichier .env dans le dossier front et ajoutez-y l'url de votre serveur d'administration, chemin compris, dans la variable PUBLIC_URL

```txt
PUBLIC_URL=https://upsignonpro.votre-domaine.fr/admin
```

```bash
cd front
yarn install
yarn build-front # this takes a while
```

DOSSIER BACK

```
cd back
cp dot-env-example .env
openssl rand -hex 30
```

Cette dernière commande génère une chaîne de caractères aléatoires que vous devez copier dans la variable SESSION_SECRET du fichier .env

Définissez aussi les autres variables du fichier .env.

```
yarn install
yarn build-server
pm2 start dashboard.config.js
pm2 save
```

En ouvrant la page https://upsignonpro.votre-domaine.fr/admin/login.html dans votre navigateur, vous devriez voir la page de connexion.

## Configuration du redémarrage automatique des serveurs

Pour configurer le redémarrage automatique des processus pm2, procédez ainsi :

- `pm2 status` pour vérifier que les processus 'upsignon-pro-server' et 'upsignon-pro-dashboard' sont bien en cours d'exécution (sinon, voir les section ci-dessus)
- `pm2 save` (pour sauvegarder la liste des processus en cours d'exécution)
- `pm2 startup -u upsignonpro` (le paramètre -u contient le nom de l'utilisateur système responsable des processus, ici upsignonpro)
- lancez la commande suggérée en tant que root.
- `su - upsignonpro`
- puis redémarrez la VM `reboot`
- puis `su - upsignonpro`
- puis vérifiez que `pm2 status` affiche bien le serveur upsignon-pro-server comme étant en cours d'exécution

NB1: pm2 status n'affiche pas les mêmes résultats selon que vous êtes root ou upsignonpro

NB2: Si vous mettez à jour NodeJS ultérieurement, vous devrez relancer ces commandes pour que pm2 utilise la nouvelle version de NodeJS.

NB3: pour mettre à jour pm2

```
su - upsignonpro
npm install pm2 -g
pm2 update
```

# Dernières configurations

Une fois que tout ce qui précède est en place, et que nous avons autorisé vos urls dans notre système, vous pouvez accéder à votre interface d'administration. Pour cela, positionnez-vous dans le dossier back du serveur d'administration

```
su - upsignonpro
cd ~/upsignon-pro-dashboard/back
```

Puis exécutez la commande suivante

```
node ./scripts/addSuperAdmin.js <votre-email@votre-domaine.fr>
```

Cette commande génère un mot de passe que vous pourrez utiliser pour cette première session (voir l'url affichée également en résultat du script).

Une fois connecté à votre interface superadmin,

- configurez l'url de votre serveur UpSignOn PRO. L'indicateur du statut doit passer au vert.
- ajoutez un groupe
- en cliquant sur le titre "Super-Admin" orange, vous pourrez voir la liste de vos gorupes. Ouvrez le groupe que vous venez de créer, puis naviguez vers la page "Paramètres" de ce groupe.
- Vous voyez alors un lien de configuration. Ce lien devra être utilisé par tous vos utilisateurs pour configurer leur application.
- Ajoutez votre adresse email (ou \*@votre-domaine.fr) à la liste des adresses email autorisées pour ce groupe
- installez l'application UpSignOn sur votre poste, puis cliquez sur le lien de configuration.
- si tout est bien configuré, vous devriez pouvoir créer votre espace UpSignOn PRO dans l'application en suivant les instructions
- lorsque votre espace aura été correctement créé, revenez dans votre dashboard d'administration, dans la page super-admin, puis utilisez le formulaire d'ajout d'un administrateur pour vousajouter à nouveau (en vous laissant le rôle Super-Admin)
- vous devriez alors recevoir un email (vérifiez vos spams) qui vous permettra d'importer votre "compte" super-admin dans UpSignOn
- ouvrez le lien que vous aurez reçu par mail puis suivez les instructions dans l'application
- notez que lors de cette étape, le mot de passe temporaire que vous aviez généré précemment est remplacé par un nouveau mot de passe, généré cette fois par l'application
- grâce à UpSignOn, vous pouvez maintenant vous connecter en un clic à votre compte super-admin et renouveler votre mot de passe directement depuis l'application.

Et voilà. Il ne vous reste plus qu'à configurer UpSignOn via votre dashboard selon vos besoins, à inviter d'autres administrateurs et à diffuser le lien de configuration à tous vos collègues.

# Note sur les paramètres OpenId

Les paramètres de configuration d'OpenId Connect sont optionnels. S'ils sont présents, l'application exigera une pré-authentification sur le service OpenId Connect désigné avant d'envoyer des requêtes au serveur UpSignOn PRO. Vous pouvez ainsi placer le serveur UpSignOn PRO derrière un NetScaler qui pourra refuser toutes les requêtes envoyées sans token OpenId.

> Notez que le serveur UpSignOn PRO lui-même ne vérifie pas les tokens OpenId qui lui sont passés.

**Trouver votre lien OpenId Connect correspondant à votre installation ADFS, Azure AD ou Azure B2C:**

From the Microsoft documentation: (more details [here](https://docs.microsoft.com/en-us/azure/active-directory/develop/msal-client-application-configuration))

- AAD authorities are of the form https://login.microsoftonline.com/\{Enter_the_Tenant_Info_Here\}.
- If your application supports Accounts in one organizational directory, replace "Enter_the_Tenant_Info_Here" value with the Tenant Id or Tenant name (for example, contoso.microsoft.com).
- If your application supports Accounts in any organizational directory, replace "Enter_the_Tenant_Info_Here" value with organizations.
- If your application supports Accounts in any organizational directory and personal Microsoft accounts, replace "Enter_the_Tenant_Info_Here" value with common.
- To restrict support to Personal Microsoft accounts only, replace "Enter_the_Tenant_Info_Here" value with consumers.
- Azure B2C authorities are of the form https://\{instance\}/\{tenant\}/\{policy\}. Each policy is considered its own authority. You will have to set the all of the knownAuthorities at the time of the client application construction.
- ADFS authorities are of the form https://\{instance\}/adfs.

# Troubleshooting

Voir la page dédiée: [/doc/Troubleshooting.md](/doc/Troubleshooting.md).
