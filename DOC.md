# Présentation d'UpSignOn PRO

## Introduction

UpSignOn PRO fournit un système de gestion de mots de passe aux entreprises.
Le système est constitué de

- une base de données à déployer un interne dans votre entreprise
- un serveur à déployer en interne dans votre entreprise, a priori accessible depuis le réseau externe
- un serveur d'administration à déployer en interne dans votre entreprise, a priori non accessible depuis le réseau externe
- l'application UpSignOn, disponible en téléchargement gratuit sur les stores iOS, Android, MacOS et Windows.

L'application UpSignOn propose un fonctionnement grand public par défaut qui est complètement découplé du fonctionnement PRO. Les deux modes de fonctionnement sont exposés dans ce document.

## Fonctionnement d'UpSignOn PRO

### Principes généraux

- Aucune donnée ne reste stockée sur les appareils des utilisateurs, tout est conservé de façon chiffrée sur le serveur PRO.
- **Zero-trust :** Le serveur PRO est conçu pour que ses administrateurs n'aient accès à aucun mot de passe.
- **Chiffrement de bout en bout :** Chaque utilisateur doit définir un mot de passe qui sert à chiffrer ses données. Ce mot de passe n'est jamais envoyé sur le serveur, le chiffrement est effectué localement, sur l'appareil de l'utilisateur.
- **Autorisation par adresse email pro :** Les administrateurs du serveur PRO choisissent quelles adresses email (par domaine ou individuellement) sont autorisées à avoir un espace PRO.
- **2FA : Autorisation individuelle de chaque appareil** un appareil n'a le droit de récupérer les données chiffrées d'un utilisateur qu'après y avoir été autorisé par l'utilisateur via l'ouverture d'un lien à usage unique reçu dans sa boîte mail professionnelle. Techniquement, un code d'accès alétoire est défini par l'appareil. Ce code n'est valide qu'après avoir été autorisé par le lien à usage unique. Ce code d'accès est ensuite nécessaire pour toutes les communications avec le serveur (en lecture et en écriture). Ce code d'accès est transparent pour l'utilisateur. Les administrateurs du serveur PRO peuvent révoquer un appareil depuis l'interface d'administration. L'utilisateur peut lui-même révoquer un de ses appareils depuis l'application. Dans ce cas, les administrateurs du système peuvent voir que l'appareil a été révoqué.
- **Mot de passe oublié :** un système à base de chiffrement asymétrique permet d'avoir une fonctionnalité de mot de passe oublié. Chaque appareil génère une paire de clés asymétrique et envoie sa clé publique sur le serveur. Lorsque le mot de passe de l'utilisateur change, l'application récupère les clés publiques de tous ses appareils autorisés, puis les utilise pour chiffrer le mot de passe pour chaque appareil. En cas d'oubli du mot de passe, l'utilisateur peut déchiffrer son mot de passe grâce à la clé privée stockée sur son appareil. Bien entendu, l'appareil n'est autorisé à récupéré le mot de passe chiffré qu'après une vérifiaction par email (qui pourrait être complétée par une validation de l'IT si nécessaire). Pour ce faire, lorsque l'appareil déclenche la procédure de mot de passe oublié, le serveur génère un token à usage unique qu'il envoie par email à l'utilisateur. L'utilisateur doit alors saisir ce token dans l'application pour pouvoir récupérer son mot de passe chiffré et le déchiffrer.
  Une limitation saine de ce système est que si l'utilisateur venait à perdre tous ses appareils et qu'il oubliait de surcroit son mot de passe, alors il ne serait plus en mesure de récupérer ses données.
- **Partage de compte :** le partage de compte est utile dans certaines situations comme par exemple pour le compte Facebook ou Twitter de la ville. Le partage de compte repose sur du chiffrement asymétrique. Chaque utilisateur possède une paire de clés RSA. Un utilisateur peut partager un mot de passe en le chiffrant avec la clé publique du destinataire. Le destinataire peut déchiffrer le mot de passe avec sa clé privée, enregistrée dans son espace PRO. Tout utilisateur peut créer un compte partagé. Les administrateurs du système voient alors l'url de ce compte et les personnes qui y ont accès, mais ne voient bien sûr pas le mot de passe associé. Ils peuvent révoquer un partage simplement. La personne qui crée un compte partagé en devient automatiquement le gestionnaire. Les administrateurs du serveur peuvent ensuite choisir le ou les gestionnaires du compte parmi les utilisateurs qui y ont accès (y compris enlever ce droit au gestionnaire initial). Un compte partagé doit toujours avoir au moins un gestionnaire. Un gestionnaire peut partager le compte avec toutes les personnes qu'il juge nécessaire, et peut également accorder les droits de gestion aux autres utilisateurs depuis l'application.
- **Sandboxing** l'application tourne dans un environnement isolé sur le système d'exploitation.

### Notes techniques

- Les informations sensibles conservées sur chaque appreil sont stockées dans la keychain du système d'exploitation (sécurisée au niveau hardware)
  - code d'accès individuel de l'appareil
  - clé privée de mot de passe oublié
  - mot de passe de l'utilisateur en cas de l'activation de la biométrie
- Les algorithmes cryptographiques suivants sont utilisés
  - PBKDF2 avec un sel de 128bits et 100 000 itérations pour la dérivation du mot de passe de l'utilisateur en clé secète AES
  - AES256-CBC avec un vecteur d'initialisation à usage unique pour le chiffrement de l'espace PRO des utilisateurs
  - Chiffrement asymétrique RS4 2048bits

### Comment faire pour...

- révoquer un appareil ? supprimez le de la la liste des appareils.
- effacer les données d'un utilisateur qui quitte l'entreprise ? effacez tous ses appareils, puis effacez cet utilisateur
- empêcher le partage d'un compte à un utilisateur ? supprimer ce partage dans la liste des partages

### Que faire dans les cas suivants ?

- Un utilisateur vous appelle car en voulant configurer son espace PRO sur son appareil, il reçoit une notification comme quoi son appareil a été révoqué
  => pour le débloquer, vous devez supprimer l'appareil en question dans la base de données

- Un utilisateur a perdu son appareil
  => révoquez cet appareil en le supprimant de la liste des appareils pour cet utilisateur. Si la date de dernière activité de cet appareil est ultérieure à la date de perte de l'appareil, demandez également à l'utilisateur de réinitialiser tous ses mots de passe et de changer son mot de passe UpSignOn par mesure de précaution.

- Des hackers sont parvenus à voler les données chiffrées de vos utilisateurs
  => par mesure de sécurité, demandez à vos utilisateurs de modifier tous leurs mots de passe et leur mot de passe UpSignOn, et révoquez également tous les appareils de la base en les supprimant.

# Fonctionnement d'UpSignOn PERSO

Vos utilisateurs ont la possibilité d'utiliser UpSignOn pour gérer leurs mots de passe personnels. Afin de vous rassurer sur le fait que même UpSignOn PERSO est parfaitement sécurisé, voici ses principes de fonctionnement.

- Aucune donnée ne reste stockée sur un serveur, tout est conservé de façon chiffrée sur l'appareil de l'utilisateur.
- **Zero-trust & zero-knowledge:** Le serveur d'UpSignOn n'a acccès à aucune information personnelle, même pas l'adresse email de l'utilisateur. L'application est conçue en imaginant que le serveur UpSignOn est compromis. Le risque de fuite de données est quasiment nul via le serveur.
- **Stockage local chiffré** localement, les données de l'utilisateur sont chiffrées par son mot de passe maître s'il en définit un.
- **Chiffrement de bout en bout :** La synchronisation des appareils de l'utilisateur est chiffrée de bout en bout. Seules les données qui changent sont envoyées sur le serveur et les données sont effacées du serveur dès que tous les appareils sont à jour. Même si un hacker réussissait à compromettre le serveur et à casser le chiffrement AES, il n'aurait accès qu'à un sous-ensemble restreint des données de l'utilisateur.
- **Sécurité logique** En plus de la sécurité cryptographique, la synchronisation des appareils repose sur une sécurité logique transparente pour l'utilisateur : le serveur n'autorise l'envoie des données chiffrées que sur présentation d'un mot de passe de synchronisation stocké dans l'espace personnel de l'utilisateur.
- **Échange de clé sécurisé** Pour que la synchronisation de bout en bout puisse fonctionner, tous les appareils de l'utilisateur doivent partager une clé de chiffrement secrète. Le partage de cette clé se fait via la procédure particulière suivante : l'appareil chiffre la clé avec un code de chiffrement aléatoire à 8 caractères qui n'est jamais envoyé au serveur. Il définit également un code d'autorisation aléatoire à 8 caractères qui agit comme un mot de passe temporaire. Il envoie le paquet chiffré contenant la clé secrète au serveur accompagnée de ce code d'autorisation. Le serveur renvoie un identifiant d'accès aléatoire et unique à 8 caractères. L'utilisateur doit saisir ou scanner l'identifiant d'accès, le code d'autorisation et le code de chiffrement sur son nouvel appareil. Le nouvel appareil peut alors récupérer le paquet chiffré contenant la clé secrète auprès du serveur en lui présentant l'identifiant d'accès et le code d'autorisation puis la déchiffrer avec le code de chiffrement. Il y a donc une sécurité cryptographique et une sécurité logique. (NB : Le code d'autorisation expire au bout de 5 minutes.)
- **Partage de compte** Le partage de compte repose exactement sur le même mécanisme que la synchronisation d'appareils (échange d'une clé secrète puis communication chiffrée de bout en bout).
- **Mot de passe oublié** L'environnement PERSO dispose d'une fonctionnalité de mot de passe oublié grâce aux contacts UpSignOn de l'utilisateur qui sont capables de l'identifier et de lui renvoyer les élements nécessaires au déverrouillage de son espace.
- **Sandboxing** l'application tourne dans un environnement isolé sur le système d'exploitation.

En résumé, la seule façon d'accéder aux données de l'utilisateur est d'avoir accès à son appareil déverrouillé et de deviner son mot de passe maître. Un hack à grande échelle ne serait envisageable qu'en exploitant une faille de sécurité majeure du système d'exploitation lui-même pour accéder au contenu de la RAM.
