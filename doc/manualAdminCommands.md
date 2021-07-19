# ALLOWED EMAILS

## List

```sql
SELECT * FROM allowed_emails;
```

## Add

Replace \<\*@domaine.fr>

```sql
INSERT INTO allowed_emails (pattern) VALUES ('<*@domaine.fr>');
```

# SETTINGS

## Change DISABLE_MANUAL_VALIDATION_FOR_PASSWORD_FORGOTTEN

Replace \< true false>

```sql
UPDATE settings SET value='<true false>' WHERE key='DISABLE_MANUAL_VALIDATION_FOR_PASSWORD_FORGOTTEN';
```

# USERS

## List users with stats

```sql
  SELECT
  users.id AS id,
  users.email AS email,

  (SELECT nb_accounts_weak FROM data_stats WHERE data_stats.user_id=users.id ORDER BY date DESC LIMIT 1) AS nb_accounts_weak,
  (SELECT nb_accounts_medium FROM data_stats WHERE data_stats.user_id=users.id ORDER BY date DESC LIMIT 1) AS nb_accounts_medium,
  (SELECT nb_accounts_strong FROM data_stats WHERE data_stats.user_id=users.id ORDER BY date DESC LIMIT 1) AS nb_accounts_strong,

  length(users.encrypted_data) AS data_size_in_octets,
  (SELECT COUNT(*) FROM user_devices WHERE user_devices.user_id=users.id) AS nb_devices,
  (SELECT COUNT(*) FROM shared_account_users WHERE shared_account_users.user_id=users.id) AS nb_shared_accounts,
  (SELECT nb_accounts FROM data_stats WHERE data_stats.user_id=users.id ORDER BY date DESC LIMIT 1) AS nb_accounts,
  (SELECT nb_codes FROM data_stats WHERE data_stats.user_id=users.id ORDER BY date DESC LIMIT 1) AS nb_codes

  FROM users
  ORDER BY nb_accounts_weak desc, nb_accounts_medium desc;
```

You can also search a particular user by adding

```sql
WHERE users.email='<username@domaine.fr'
```

before `ORDER BY`

## List users that use weak or medium passwords

```sql
  SELECT
  users.email AS email,
  (SELECT nb_accounts_weak FROM data_stats WHERE data_stats.user_id=users.id ORDER BY date DESC LIMIT 1) AS nb_accounts_weak,
  (SELECT nb_accounts_medium FROM data_stats WHERE data_stats.user_id=users.id ORDER BY date DESC LIMIT 1) AS nb_accounts_medium
  FROM users
  WHERE (SELECT nb_accounts_weak FROM data_stats WHERE data_stats.user_id=users.id ORDER BY date DESC LIMIT 1) > 0 OR (SELECT nb_accounts_medium FROM data_stats WHERE data_stats.user_id=users.id ORDER BY date DESC LIMIT 1) > 0
  ORDER BY nb_accounts_weak desc, nb_accounts_medium desc;
```

## List a user's devices and associated password reset requests

Replace \<user email>

```sql
SELECT
  users.email, ud.id AS device_id, ud.authorization_status, ud.device_name,ud.device_type, ud.app_version,
  prr.status AS pwd_reset_request_status, prr.id AS pwd_reset_request_id
FROM user_devices AS ud
INNER JOIN users ON users.id=ud.user_id
LEFT JOIN password_reset_request AS prr ON prr.device_id=ud.id
WHERE users.email='<user email>';
```

## List all pending user reset requests

```sql
SELECT users.email, prr.status AS pwd_reset_request_status, prr.id AS pwd_reset_request_id
FROM user_devices AS ud
INNER JOIN users ON users.id=ud.user_id
INNER JOIN password_reset_request AS prr ON prr.device_id=ud.id;
```

## Grant permission for a user to reset his password

In bash, from the root of this project, replace \<pwd_reset_request_id> and run

```bash
node ./scripts/grantUserPasswordResetRequest.js <pwd_reset_request_id>
```

## Revoke a user's device

Replace \<device_id> with id from above request.

```sql
DELETE FROM user_devices WHERE id='<device_id>';
```

# SHARED ACCOUNTS

## List

```sql
SELECT id, name, url, login, type FROM shared_accounts;
```

## List authorized users for a shared account

Replace \<shared account id>

```sql
SELECT users.email, shared_account_users.shared_account_id, shared_account_users.user_id,shared_account_users.is_manager
FROM shared_account_users
INNER JOIN users ON users.id=shared_account_users.user_id
WHERE shared_account_users.shared_account_id='<shared account id>';
```

## Revoke an account sharing with a user

Replace \<shared account id> AND \<user id>

```sql
DELETE FROM shared_account_users WHERE shared_account_id='<shared account id>' AND user_id='<user id>';
```

## Change manager rights for a user on a shared account

Replace \< true false>, \<shared account id> and \<user id>

```sql
UPDATE shared_account_users SET is_manager='<true false>' WHERE shared_account_id='<shared account id>' AND user_id='<user id>';
```

# URLs

## List

```sql
SELECT id, displayed_name, signin_url, password_change_url FROM url_list;
```

## Add a URL that your coworkers may need

Replace \<name>, \<signin url> and \<password change url> (which can be empty)

```sql
INSERT INTO url_list (displayed_name, signin_url, password_change_url) VALUES ('<name>', '<signin url>','<password change url>');
```
