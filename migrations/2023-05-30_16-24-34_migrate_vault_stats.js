//2023-05-30_16-24-34_migrate_vault_stats

exports.up = function (db) {
  return db.query(`ALTER TABLE users
    ADD COLUMN IF NOT EXISTS nb_accounts INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS nb_codes INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS nb_accounts_strong INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS nb_accounts_medium INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS nb_accounts_weak INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS nb_accounts_with_duplicated_password INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS nb_accounts_with_no_password INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS nb_accounts_red INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS nb_accounts_orange INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS nb_accounts_green INTEGER DEFAULT 0
  `);
}

exports.down = function (db) {
  return db.query(`ALTER TABLE users
    DROP COLUMN IF EXISTS nb_accounts INTEGER DEFAULT 0,
    DROP COLUMN IF EXISTS nb_codes INTEGER DEFAULT 0,
    DROP COLUMN IF EXISTS nb_accounts_strong INTEGER DEFAULT 0,
    DROP COLUMN IF EXISTS nb_accounts_medium INTEGER DEFAULT 0,
    DROP COLUMN IF EXISTS nb_accounts_weak INTEGER DEFAULT 0,
    DROP COLUMN IF EXISTS nb_accounts_with_duplicated_password INTEGER DEFAULT 0,
    DROP COLUMN IF EXISTS nb_accounts_with_no_password INTEGER DEFAULT 0,
    DROP COLUMN IF EXISTS nb_accounts_red INTEGER DEFAULT 0,
    DROP COLUMN IF EXISTS nb_accounts_orange INTEGER DEFAULT 0,
    DROP COLUMN IF EXISTS nb_accounts_green INTEGER DEFAULT 0
  `);
}
