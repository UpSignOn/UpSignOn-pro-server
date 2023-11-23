# Déploiements par GPO

## Déploiement de l'application pour windows

> Attention, cette méthode de déploiement ne permet pas pour l'instant à l'application de se mettre à jour automatiquement. Pour avoir les mises-à-jour automatiques, vous devez passer par le Microsoft Store.

Le fichier d'installation msi est disponible sur le lien suivant: [https://app.upsignon.eu/UpSignOn-7.0.14-installer.msi](https://app.upsignon.eu/UpSignOn-7.0.14-installer.msi);

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
