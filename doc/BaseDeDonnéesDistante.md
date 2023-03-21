# Configuration dans le cas d'une base de données distante

Sur la VM où se trouve la base de données

- éditer le fichier /etc/postgres/13/main/postgresqql.conf

```
listen_addresses='*'
```

- éditer le fichier /etc/postgres/13/main/pg_hba.conf

```
host upsignonpro upsignonpro XXX.XXX.XXX.XXX/32 md5
```

- `systemctl restart postgresql`
