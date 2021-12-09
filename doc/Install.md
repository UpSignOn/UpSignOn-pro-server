# IMPORTANT : AMÉLIORATION CONTINUE

Afin de vous proposer la meilleure documentation possible, nous vous serions très reconnaissant de nous faire part de toutes remarques, erreurs, et ommissions que vous détecteriez dans ce qui suit. contact@upsignon.eu

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

| Origine                  | Destination                                        | PORT             |
| ------------------------ | -------------------------------------------------- | ---------------- |
| Client lourd             | Serveur UpSignOn PRO                               | 443              |
| Navigateur               | Serveur d'administration                           | 443              |
| Serveur UpSignOn PRO     | Base de données                                    | 5432             |
| Serveur d'administration | Base de données                                    | 5432             |
| Serveur UpSignOn PRO     | Serveur SMTP                                       | 25 ou 587 ou 465 |
| Serveur d'administration | Serveur SMTP                                       | 25 ou 587 ou 465 |
| Serveur UpSignOn PRO     | app.upsignon.eu                                    | 443              |
| Serveur UpSignOn PRO     | internet (pour l'installation et les mises à jour) | 443              |
| Serveur d'administration | internet (pour l'installation et les mises à jour) | 443              |

NB: le serveur SMTP mentionné est le serveur SMTP de votre entreprise et non un serveur qu'il faudrait installer en plus pour UpSignOn.

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

- serveur smtp (smtp.votre-domaine.fr)
- port d'envoi (ex: 25, 587, 465)
- adresse email (ex: noreply@votre-domaine.fr)
- mot de passe pour cette adresse email si nécessaire

## Déclarez-nous vos urls

Nous devons déclarer vos urls dans notre base de données pour qu'elles soit autorisées.

- l'URL de votre serveur UpSignOn PRO, https://upsignonpro.votre-domaine.fr, chemin y compris le cas échéant
- l'URL de votre serveur d'administration, https://upsignonpro.votre-domaine.fr/admin, chemin y compris le cas échéant

Envoyez-nous ces deux urls par email (giregk@upsignon.eu) **avant** de commencer l'installation pour ne pas perdre de temps.

# Installation de la base de données

1. installation de postgresql

Suivez les instructions correspondant à votre système sur https://www.postgresql.org/download/ (toutes les versions de postgresql devraient fonctionner, prenez la dernière version LTS).

2. création de la base de données pour UpSignOn PRO
   La procédure qui suis a été écrite pour Debian 10.

Créez un utilisateur système upsignonpro

```bash
root@localhost:~# adduser upsignonpro
```

Connectez-vous en tant qu'utilisateur postgres à la base de données PostgreSQL :

```bash
root@localhost:~# su - postgres
postgres@localhost:~$ psql
```

Configurez le rôle upsignonpro pour la base de données

```
postgres=# CREATE ROLE upsignonpro WITH LOGIN;
```

Ajoutez ensuite un mot de passe au role upsignonpro, puis sortez de l'invite de commande PSQL. NB, par la suite ce mot de passe sera associé à la variable d'environnement DB_PASS.

```
postgres=# \password upsignonpro;
postgres=# quit
```

Créez la base de données (NB: cette base de données sera provisionnée dans l'étape suivante)

```bash
postgres@localhost:~$ createdb upsignonpro -O upsignonpro
```

À partir de là, vous devriez pouvoir vous connecter à votre base de données en tant qu'utilisateur 'upsignonpro':

```bash
postgres@localhost:~$ exit
root@localhost:~# su - upsignonpro
upsignonpro@localhost:~$ psql upsignonpro
```

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

  ```bash
  root@localhost:~# curl -fsSL https://deb.nodesource.com/setup_16.x | bash -
  root@localhost:~# apt-get install -y nodejs
  ```

- installer [git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git). NB: il n'est pas nécessaire de définir un utilisateur github

  ```bash
  root@localhost:~# apt install git
  ```

- installer Nginx (reverse proxy)

  ```bash
  root@localhost:~# apt install nginx
  ```

- ajoutez vos fichiers de certificats SSL, par exemple dans le dossier /etc/nginx/ssl
  - `root@localhost:~# mkdir /etc/nginx/ssl/`
  - fichier certificat: /etc/nginx/ssl/upsignonpro.cer
    > ATTENTION, il est primordial que ce fichier contienne toute la chaine de certification. Autrement l'application mobile refusera d'exécuter les requêtes vers votre serveur. Vous pouvez tester que c'est bien le cas grâce au site [https://whatsmychaincert.com](https://whatsmychaincert.com)
  - fichier clé privée: /etc/nginx/ssl/upsignonpro.key
  - `root@localhost:~# chmod 400 /etc/nginx/ssl/*`

En tant qu'utilisateur **upsignonpro**

```bash
root@localhost:~# su - upsignonpro

upsignonpro@localhost:~$ mkdir ~/.npm-global
upsignonpro@localhost:~$ npm config set prefix '~/.npm-global'
upsignonpro@localhost:~$ echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
upsignonpro@localhost:~$ source ~/.bashrc

upsignonpro@localhost:~$ npm install -g pm2
upsignonpro@localhost:~$ npm install -g yarn

upsignonpro@localhost:~$ pm2 install pm2-logrotate
```

Configurer votre proxy si besoin:

```bash
upsignonpro@localhost:~$ git config --global http.proxy http://username:password@host:port

upsignonpro@localhost:~$ git config --global http.sslVerify false

upsignonpro@localhost:~$ git config --global http.proxyAuthMethod 'basic'

upsignonpro@localhost:~$ npm config set proxy http://username:password@host:port

upsignonpro@localhost:~$ yarn config set proxy http://username:password@host:port
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

En tant qu'utilisateur upsignonpro

```bash
upsignonpro@localhost:~$ cd

upsignonpro@localhost:~$ git clone --branch production https://github.com/UpSignOn/UpSignOn-pro-server.git upsignon-pro-server

upsignonpro@localhost:~$ cd upsignon-pro-server

upsignonpro@localhost:~/upsignon-pro-server$ yarn install

upsignonpro@localhost:~/upsignon-pro-server$ yarn build

upsignonpro@localhost:~/upsignon-pro-server$ cp dot-env-example .env
```

Éditez ensuite le fichier `.env` pour y définir toutes vos variables d'environnement.

Puis créez la structure de votre base de données

```bash
upsignonpro@localhost:~/upsignon-pro-server$ node ./scripts/migrateUp.js
```

Vous pouvez vérifier que tout s'est bien passé en vous connectant à votre base de données (`psql upsignonpro`) puis en tapant `\d` pour afficher toutes les tables. Le résultat ne doit pas être vide. (Dans le cas d'une base de données distante, utilisez la commande `psql -h 127.0.0.1 -U upsignonpro -p 5432 upsignonpro`, en remplaçant l'IP par celle de votre base de données)

Démarrez ensuite le serveur

```bash
upsignonpro@localhost:~/upsignon-pro-server$ yarn start
upsignonpro@localhost:~/upsignon-pro-server$ pm2 save
```

Si le service upsignon-pro-server s'affiche en statut "Errored", consultez les logs

- upsignon-pro-server/logs
- ~/.pm2/pm2.logs

ou via la commande `pm2 logs` qui affiche directement tous les logs dont pm2 est responsable

Vous pouvez vérifier que la page https://upsignonpro.votre-domaine.fr affiche bien un message de succès.

Vous pouvez également tester que l'envoi des emails fonctionne bien en ouvrant la page https://upsignonpro.votre-domaine.fr/test-email?email=votre-email@votre-domaine.fr

## Installation du serveur d'administration

En tant qu'utilisateur upsignonpro

```bash
upsignonpro@localhost:~$ cd

upsignonpro@localhost:~$ git clone --branch production https://github.com/UpSignOn/upsignon-pro-dashboard.git

upsignonpro@localhost:~$ cd upsignon-pro-dashboard
```

Vous pouvez voir qu'il y a deux dossiers dans ce projet.

DOSSIER FRONT

Créez un fichier .env dans le dossier front et ajoutez-y l'url de votre serveur d'administration, chemin compris, dans la variable PUBLIC_URL

```txt
PUBLIC_URL=https://upsignonpro.votre-domaine.fr/admin
```

```bash
upsignonpro@localhost:~/upsignon-pro-dashboard$ cd front
upsignonpro@localhost:~/upsignon-pro-dashboard/front$ yarn install
upsignonpro@localhost:~/upsignon-pro-dashboard/front$ yarn build-front # ceci prend un peu de temps
```

DOSSIER BACK

```bash
upsignonpro@localhost:~/upsignon-pro-dashboard$ cd back
upsignonpro@localhost:~/upsignon-pro-dashboard/back$ cp dot-env-example .env
upsignonpro@localhost:~/upsignon-pro-dashboard/back$ openssl rand -hex 30
```

Cette dernière commande génère une chaîne de caractères aléatoires que vous devez copier dans la variable SESSION_SECRET du fichier .env

Définissez aussi les autres variables du fichier .env.

```
upsignonpro@localhost:~/upsignon-pro-dashboard/back$ yarn install
upsignonpro@localhost:~/upsignon-pro-dashboard/back$ yarn build-server
upsignonpro@localhost:~/upsignon-pro-dashboard/back$ pm2 start dashboard.config.js
```

En ouvrant la page https://upsignonpro.votre-domaine.fr/admin/login.html dans votre navigateur, vous devriez voir la page de connexion.

## Configuration du redémarrage automatique des serveurs

Pour configurer le redémarrage automatique des processus pm2 au reboot de la VM, procédez ainsi :

### Serveur UpSignOn PRO

```bash
root@localhost:~# vi /etc/systemd/system/upsignonpro-server.service
```

Dans ce fichier, ajoutez ceci (pensez à bien adapter les chemins si besoin)

```
[Unit]
Description=UpSignOn PRO server
After=network.target remote-fs.target nss-lookup.target

[Service]
Type=forking
RemainAfterExit=1
ExecStart=/usr/local/bin/pm2 start /home/upsignonpro/upsignon-pro-server/ecosystem.config.js
ExecReload=/usr/local/bin/pm2 startOrReload /home/upsignonpro/upsignon-pro-server/ecosystem.config.js
ExecStop=/usr/local/bin/pm2 stop /home/upsignonpro/upsignon-pro-server/ecosystem.config.js
User=upsignonpro
WorkingDirectory=/home/upsignonpro/upsignon-pro-server

[Install]
WantedBy=multi-user.target
```

Puis modifiez les droits sur ce fichier et activez-le:

```bash
root@localhost:~# chmod 644 /etc/systemd/system/upsignonpro-server.service
root@localhost:~# systemctl enable upsignonpro-server.service
root@localhost:~# systemctl daemon-reload
```

### Serveur d'administration

```bash
root@localhost:~# vi /etc/systemd/system/upsignonpro-dashboard.service
```

Dans ce fichier, ajoutez ceci (pensez à bien adapter les chemins si besoin)

```
[Unit]
Description=UpSignOn PRO Dashboard server
After=network.target remote-fs.target nss-lookup.target

[Service]
Type=forking
RemainAfterExit=1
ExecStart=/usr/local/bin/pm2 start /home/upsignonpro/upsignon-pro-dashboard/back/dashboard.config.js
ExecReload=/usr/local/bin/pm2 startOrReload /home/upsignonpro/upsignon-pro-dashboard/back/dashboard.config.js
ExecStop=/usr/local/bin/pm2 stop /home/upsignonpro/upsignon-pro-dashboard/back/dashboard.config.js
User=upsignonpro
WorkingDirectory=/home/upsignonpro/upsignon-pro-dashboard/back

[Install]
WantedBy=multi-user.target
```

Puis modifiez les droits sur ce fichier et activez-le:

```bash
root@localhost:~# chmod 644 /etc/systemd/system/upsignonpro-dashboard.service
root@localhost:~# systemctl enable upsignonpro-dashboard.service
root@localhost:~# systemctl daemon-reload
```

## Configuration des mises-à-jour automatiques des serveurs

Pour configurer les mises-à-jour automatiques des serveurs, procédez ainsi :

```bash
root@localhost:~# crontab -e
```

Puis ajoutez ces deux taches cron:

```
0 5 * * * su - upsignonpro -c "cd /home/upsignonpro/upsignon-pro-server; ./update.sh"
5 5 * * * su - upsignonpro -c "cd /home/upsignronpro/upsignon-pro-dashboard; ./update.sh"
```

Puis relancer le service cron

```bash
root@localhost:~# service cron reload
```

# Dernières configurations

**Toute première connexion à la console d'administration**
Une fois que tout ce qui précède est en place, et que nous avons autorisé vos urls dans notre système, vous pouvez accéder à votre interface d'administration. Pour cela, positionnez-vous dans le dossier back du serveur d'administration

```bash
root@localhost:~# su - upsignonpro
upsignonpro@localhost:~$ cd ~/upsignon-pro-dashboard/back
```

Puis exécutez la commande suivante

```bash
upsignonpro@localhost:~$ node ./scripts/addSuperAdmin.js <votre-email@votre-domaine.fr>
```

NB: l'adresse email qui est saisie ici n'a pas d'importance, vous pourrez la supprimer plus tard et aucun email ne lui sera envoyé.

Cette commande génère un mot de passe temporaire que vous pourrez utiliser pour la première session (voir l'url affichée également en résultat du script).

**Ajout d'un premier groupe**
Une fois connecté à votre interface superadmin,

- configurez l'url de votre serveur UpSignOn PRO. L'indicateur du statut doit passer au vert.
- ajoutez un groupe
- en cliquant sur le block "Super-Admin" orange, tout en haut à gauche de la page, vous pourrez voir la liste de vos groupes. Ouvrez le groupe que vous venez de créer, puis naviguez vers la page "Paramètres" de ce groupe.
- Vous voyez alors un lien de configuration. Ce lien devra être utilisé par tous vos utilisateurs pour configurer leur application.

**Création de votre espace UpSignOn PRO**

- Ajoutez votre adresse email (ou \*@votre-domaine.fr) à la liste des adresses email autorisées pour ce groupe
- installez l'application UpSignOn sur votre poste, puis cliquez sur le lien de configuration / scannez le qr code depuis UpSignOn en cliquant sur "ajouter un espace confidentiel" puis en sélectionnant l'option ESPACE PRO
- si tout est bien configuré, vous devriez pouvoir créer votre espace UpSignOn PRO dans l'application en suivant les instructions

**Configuration de la connexion à la console directement via UpSignOn**
Le mot de passe que vous avez utilisé précédemment pour vous connecter était temporaire. Grâce à UpSignOn, vous allez pouvoir vous connecter très simplement à votre console d'administration.

- lorsque votre espace aura été correctement créé, revenez dans votre dashboard d'administration, dans la page super-admin, puis utilisez le formulaire d'ajout d'un administrateur pour vous ajouter à nouveau (en vous laissant le rôle Super-Admin). Vous pouvez remettre une adresse email qui existe déjà dans la liste.
- vous devriez alors recevoir un email (vérifiez éventuellement vos spams) qui vous permettra d'importer votre "compte" super-admin dans UpSignOn
- ouvrez le lien que vous aurez reçu par mail puis suivez les instructions dans l'application
- notez que lors de cette étape, le mot de passe temporaire que vous aviez généré précedemment est remplacé par un nouveau mot de passe, généré cette fois par l'application
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
