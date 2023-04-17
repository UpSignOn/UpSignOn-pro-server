# Déploiements par GPO

## Déploiement de l'application pour windows

> Attention, cette méthode de déploiement ne permet pas à l'application de se mettre à jour automatiquement. Pour avoir les mises-à-jour automatiques, vous devez passer par le Microsoft Store ou le Microsoft Store pour Entreprises.

- Téléchargez le dossier [https://app.upsignon.eu/windows-sideloading-gpo/UpSignOn_latest](https://app.upsignon.eu/windows-sideloading-gpo/UpSignOn_latest)

- Il s'agit d'un dossier zip. Ajoutez-lui l'extension .zip pour pouvoir extraire son contenu.

- Vous pouvez alors déployer ce dossier par GPO et lancer le script d'installation qui y est inclus par GPO pour installer l'application chez tous vos collaborateurs.

> Attention, la GPO doit être appliquée à l'utilisateur et non à l'ordinateur.

## Déploiement du module UpSignOnHelper (pour windows uniquement)

Pour permettre aux extensions de navigateur de communiquer avec l'application sur windows, vous aller devoir:

- télécharger UpSignOnHelper ici : [https://app.upsignon.eu/UpSignOnHelper.zip](https://app.upsignon.eu/UpSignOnHelper.zip)
- déployer le dossier UpSignOnHelper dézippé sur les postes de vos utilisateurs, à n'importe quel emplacement, par exemple C:\Program Files\UpSignOnHelper
- vérifiez dans les propriétés du fichier UpSignOnHelper.exe, dans l'onglet général, que son exécution n'est pas bloquée.
- exécuter le programme UpSignOnHelper.exe avec les droits administrateurs pour mettre à jour le registre. Vous pouvez également configurer directement le registre avec les clés suivantes selon les navigateurs utilisés et en adpatant les valeurs à l'emplacement que vous avez choisi :

  - Computer\HKEY_LOCAL_MACHINE\SOFTWARE\Mozilla\NativeMessagingHosts\eu.datasmine.upsignon

    - (Default) - REG_SZ = C:\Program Files\UpSignOnHelper\Assets\nativeMessagingMozilla.json

  - Computer\HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Edge\NativeMessagingHosts\eu.datasmine.upsignon

    - (Default) - REG_SZ = C:\Program Files\UpSignOnHelper\Assets\nativeMessagingEdge.json

  - Computer\HKEY_LOCAL_MACHINE\SOFTWARE\Google\Chrome\NativeMessagingHosts\eu.datasmine.upsignon
    - (Default) - REG_SZ = C:\Program Files\UpSignOnHelper\Assets\nativeMessagingChrome.json

Notez que si vous déplacez le dossier UpSignOnHelper par la suite, vous devrez relancer UpSignOnHelper.exe avec les droits administrateurs, ou mettre manuellement à jour les valeurs du registre.

Vous pouvez ensuite tester que l'extension de navigateur est désormais capable de lister automatiquement les espaces UpSignOn PRO et PERSO de l'application et de les déverrouiller, y compris avec la biométrie si elle a été configurée dans l'application.

## Déploiement des extensions de navigateur

### Firefox

Documentation complète: [https://github.com/mozilla/policy-templates/blob/master/README.md](https://github.com/mozilla/policy-templates/blob/master/README.md)

Règles à configurer:

- ([Extensions](https://github.com/mozilla/policy-templates/blob/master/README.md#extensions))

  Utilisez plutôt ExtensionSettings (voir ci-dessous), mais ExtensionSettings désactivera vos règles Extensions si vous définissez les deux.

- [ExtensionSettings](https://github.com/mozilla/policy-templates/blob/master/README.md#extensionsettings)

  Configurez l'installation automatique d'UpSignOn

  ```
  ExtensionSettings: {
    "upsignon@upsignon.eu": {
      "installation_mode": "force_installed",
      "install_url": "https://addons.mozilla.org/firefox/downloads/latest/upsignon/latest.xpi",
      "updates_disabled": false
    }
  }
  ```

- [PasswordManagerEnabled](https://github.com/mozilla/policy-templates/blob/master/README.md#passwordmanagerenabled) = FALSE

  Attention : je ne sais pas encore si ce paramètre a pour effet de perdre les mots de passe déjà enregistrés dans Firefox. (Mais il serait étonant que ce soit le cas).

- [OfferToSaveLogins](https://github.com/mozilla/policy-templates/blob/master/README.md#offertosavelogins) = FALSE

- [AutoLaunchProtocolsFromOrigins](https://github.com/mozilla/policy-templates/blob/master/README.md#autolaunchprotocolsfromorigins)

  Ajoutez le protocole "upsignon"

  ```
  AutoLaunchProtocolsFromOrigins = [
    ...,
    {
      "allowed_origins": [
        "https://upsignon.eu",
        "https://app.upsignon.eu",
      ],
      "protocol": "upsignon"
    }
  ]
  ```

### Chrome

Documentation générale: [https://support.google.com/chrome/a/answer/187202?hl=fr](https://support.google.com/chrome/a/answer/187202?hl=fr)

Liste des règles: [https://cloud.google.com/docs/chrome-enterprise/policies](https://cloud.google.com/docs/chrome-enterprise/policies)

Règles à configurer:

- [ExtensionInstallForceList](https://cloud.google.com/docs/chrome-enterprise/policies/?policy=ExtensionInstallForcelist)

  Ajoutez UpSignOn dans cette liste

  ```
  ["ikddeecpbbbnfmnkldhnhjlljddnjbon"]
  ```

- [ExtensionSettings](https://cloud.google.com/docs/chrome-enterprise/policies/?policy=ExtensionSettings)

  Configurez l'installation automatique d'UpSignOn

  ```
  {
    "ikddeecpbbbnfmnkldhnhjlljddnjbon": {
      "installation_mode": "force_installed",
      "toolbar_pin": "force_pinned",
    }
  }
  ```

- [PasswordManagerEnabled](https://cloud.google.com/docs/chrome-enterprise/policies/?policy=PasswordManagerEnabled) = FALSE

  NB: les anciens mdp seront toujours accessibles

- [AutoLaunchProtocolsFromOrigins](https://cloud.google.com/docs/chrome-enterprise/policies/?policy=AutoLaunchProtocolsFromOrigins)

  Autorisez le protocole "upsignon" depuis n'importe où

  ```
  AutoLaunchProtocolsFromOrigins = [
    {
      "allowed_origins": [ "*" ],
      "protocol": "upsignon"
    }
  ]
  ```

### Edge

Documentation Générale : [https://docs.microsoft.com/en-us/deployedge/microsoft-edge-manage-extensions-policies](https://docs.microsoft.com/en-us/deployedge/microsoft-edge-manage-extensions-policies)

Liste des règles : [https://docs.microsoft.com/en-us/deployedge/microsoft-edge-policies](https://docs.microsoft.com/en-us/deployedge/microsoft-edge-policies)

Règles à configurer:

- [ExtensionInstallForcelist](https://docs.microsoft.com/en-us/DeployEdge/microsoft-edge-policies#extensioninstallforcelist)

  Ajoutez UpSignOn dans cette liste

  ```
  ["jhglfkcppgkgenonjpoopfbobcdlffgg"]
  ```

- [ExtensionSettings](https://docs.microsoft.com/en-us/DeployEdge/microsoft-edge-policies#extensionsettings)

  Configurez l'installation automatique d'UpSignOn

  ```
  {
    "jhglfkcppgkgenonjpoopfbobcdlffgg": {
      "installation_mode": "force_installed",
      "toolbar_state": "force_shown",
    }
  }
  ```

- [PasswordManagerEnabled](https://docs.microsoft.com/en-us/deployedge/microsoft-edge-policies#passwordmanagerenabled) = FALSE

  NB: les anciens mdp seront toujours accessibles

- [AutoLaunchProtocolsFromOrigins](https://docs.microsoft.com/en-us/deployedge/microsoft-edge-policies#autolaunchprotocolsfromorigins)

  Autorisez le protocole "upsignon" depuis n'importe où

  ```
  AutoLaunchProtocolsFromOrigins = [
    {
      "allowed_origins": [ "*" ],
      "protocol": "upsignon"
    }
  ]
  ```
