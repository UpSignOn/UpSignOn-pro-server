# Prérequis, architecture et installation

Voir la page dédiée: [/doc/Install.md](/doc/Install.md)

# Mise à jour des serveurs

Serveur UpSignOn PRO

```
root@localhost:~# su - upsignonpro
upsignonpro@localhost:~$ cd ~/upsignon-pro-server
upsignonpro@localhost:~/upsignon-pro-server$ ./update.sh
```

Serveur d'administration

```
root@localhost:~# su - upsignonpro
upsignonpro@localhost:~$ cd ~/upsignon-pro-dashboard
upsignonpro@localhost:~/upsignon-pro-dashboard$ ./update.sh
```

# Téléchargement de l'application

- iOS (via AppStore) https://apps.apple.com/us/app/upsignon/id1474805603?l=fr
- Android (via Play Store) https://play.google.com/store/apps/details?id=eu.upsignon&hl=fr&gl=US
- MacOS (via Mac App Store) https://apps.apple.com/ky/app/upsignon/id1474805603
- Windows 10 (du plus recommandé au moins recommandé)
  - via Microsoft Store https://www.microsoft.com/fr-fr/p/upsignon/9n811tstg52w
  - via AppInstaller (permet également la mise-à-jour automatique de l'application) https://app.upsignon.eu/windows-sideloading/
    Vous pouvez également distribuer directement le fichier https://app.upsignon.eu/windows-sideloading/UpSignOn.appinstaller par GPO
  - via un script d'installation (mises-à-jour manuelles): https://app.upsignon.eu/windows-sideloading-gpo/UpSignOn_latest (dossier zip à dézipper en lui rajoutant l'extension .zip)

# Déploiement des extensions de navigateur

Voir la page dédiée: [/doc/GPO_deployment.md](/doc/GPO_deployment.md)

# Résolution de problèmes

Voir la page dédiée: [/doc/Troubleshooting.md](/doc/Troubleshooting.md)

# Transfert de la base de données

Voir la page dédiée: [/doc/DBTransfer.md](/doc/DBTransfer.md)
