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

> Warning 2: all users will have to re-authorize their devices. They will loose ability to use the password reset procedure until they've re-authorized at least one device, which means they will need their password. We recommend you send them a notice about this before continuing and that you do not remove the data from the current database before everyone has migrated.

> Warning: this procedure will break the folder parent of shared items. We recommend all users place all their shared items into the default folder before the change.

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
