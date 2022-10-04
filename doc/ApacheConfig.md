# Configuration d'Apache

1. Activer TLS

```
sudo a2enmod ssl
sudo systemctl reload apache2
```

2. Activer le module Proxy

```
sudo a2enmod proxy
```

3. Ajouter la configuration du serveur dans un fichier /etc/apache2/sites-enabled/upsignonpro

```
<VirtualHost *:443>
  ServerName upsignonpro.votre-site.com

  ProxyRequests Off
  SSLProxyEngine on
  SSLProxyVerify none
  SSLProxyCheckPeerCN off
  SSLProxyCheckPeerName off

  ProxyPass "/admin/" "https://localhost:3001/"
  ProxyPassReverse  "/admin/" "https://localhost:3001/"
  ProxyPassReverseCookieDomain "localhost:3001" "upsignonpro.votre-site.com"

  ProxyPass "/" "https://localhost:3000/"
  ProxyPassReverse  "/" "https://localhost:3000/"
  ProxyPassReverseCookieDomain "localhost:3000" "upsignonpro.votre-site.com"

  <Proxy *>
    allow from all
  </Proxy>

   SSLEngine on
   SSLCertificateFile /home/upsignonpro/ssl.combined
   SSLCertificateKeyFile /home/upsignonpro/ssl.key
   SSLCACertificateFile /home/upsignonpro/ssl.ca
   SSLProtocol all -SSLv2 -SSLv3 -TLSv1 -TLSv1.1
</VirtualHost>
```
