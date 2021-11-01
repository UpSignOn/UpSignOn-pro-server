# DB transfer

You can export your database to a file with this command (the file here is dump.sql, which you can change)

```
pg_dump -a -T admin_sessions -T admins -T migrations upsignonpro > dump.sql
```

You can then import this file into a new database (after the provisioning has been run)

```
psql -d dbname < dump.sql
```
