//2023-05-23_16-48-32_create_shared_vaults

exports.up = function (db) {
  return db.query(`CREATE TABLE IF NOT EXISTS shared_vaults (
    id SERIAL PRIMARY KEY,
    group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
    name TEXT,
    encrypted_data TEXT,
    key_backup TEXT,
    key_backup_shamir_index INTEGER,
    last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT current_timestamp(0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT current_timestamp(0),
    nb_accounts INTEGER DEFAULT 0,
    nb_codes INTEGER DEFAULT 0,
    nb_accounts_strong INTEGER DEFAULT 0,
    nb_accounts_medium INTEGER DEFAULT 0,
    nb_accounts_weak INTEGER DEFAULT 0,
    nb_accounts_with_duplicated_password INTEGER DEFAULT 0,
    nb_accounts_with_no_password INTEGER DEFAULT 0,
    nb_accounts_red INTEGER DEFAULT 0,
    nb_accounts_orange INTEGER DEFAULT 0,
    nb_accounts_green INTEGER DEFAULT 0
  )`);
}

exports.down = function (db) {
  return db.query("DROP TABLE IF EXISTS shared_vaults");
}
