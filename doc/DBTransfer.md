# DB transfer

You can export your whole database to a file with this command (the file here is dump.sql, which you can change)

```
pg_dump -a -T admin_sessions -T admins -T migrations upsignonpro > dump.sql
```

You can then import this file into a new database (after the provisioning has been run)

```
psql -d dbname < dump.sql
```

# Group data transfer

You can transfer data for one group only.

- First, export these data to a file:

  ```
  node ./scripts/groupDataExport.js <groupIdToExport> <path/to/exported/data/file.json>
  ```

- Transfer the file to the server of the new database.
  Then import this file to another database / another group:

  ```
  node ./scripts/groupDataImport.js <groupIdToImportTo> <path/to/exported/data/file.json>
  ```

- Don't forget to delete the data file after you're done.

  ```
  rm <path/to/exported/data/file.json>
  ```
