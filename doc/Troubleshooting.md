# Résolution de problèmes

## L'application affiche une erreur à l'ouverture du lien de configuration

Si à l'ouverture du lien de configuration, vous obtenez une erreur

```
Le serveur https://... ne peut pas être contacté. Assurez-vous d'avoir une connexion internet.
```

vous avez probablement l'un des problèmes suivants

- votre serveur n'est accessible que depuis un réseau local et vous n'y êtes pas connecté
  - assurez-vous d'être connecté à votre VPN
- votre certificat est autosigné ou la chaine de certification est cassée
  - vous pouvez le vérifier simplement en ouvrant l'url de votre serveur dans un navigateur
  - les certificats autosignés ne fonctionneront qu'à condition d'être approuvés par votre système d'exploitation
  - votre fichier .crt doit contenir les uns à la suite des autres la chaine de certificats jusqu'à un certificat signé par une autorité de certification (qui lui n'a pas besoin d'être inclus). Utilisez l'outil https://whatsmychaincert.com/ pour vérifier la validité de votre certificat.
- votre parefeu interdit la connexion par défaut et doit être explicitement configuré pour l'autoriser

Si tout ce qui précède semble bon, essayez d'ajouter un espace personnel vide. Si vous êtes capables de le créer sans générer de toaster d'erreur, la connexion internet n'est pas en cause et le problème est spécifique à votre serveur.

## L'envoi des mails ne fonctionne pas

- vérifiez que le port que vous avez défini dans votre fichier .env est bien ouvert sur le serveur smtp ciblé
  `nmap -p 587 upsignon.eu`
- vérifiez que le compte que vous avez défini dans votre fichier .env pour envoyer vos emails n'est pas configuré pour exiger des authentifications multi-facteurs.

## pm2 status indique "Errored"

Vérifiez les logs dans

- upsignon-pro-server/logs
- upsignon-pro-dashboard/logs
- ~/.pm2/pm2.log

ou directement avec la commande `pm2 logs`
