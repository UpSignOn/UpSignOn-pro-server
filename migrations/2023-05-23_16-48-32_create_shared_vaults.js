//2023-05-23_16-48-32_create_shared_vaults

exports.up = function (db) {
  return db.query(`CREATE TABLE IF NOT EXISTS shared_vaults (
    id SERIAL PRIMARY KEY,
    group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
    name VARCHAR(512),
    encrypted_data TEXT,
    key_backup TEXT,
    key_backup_shamir_index INTEGER,
    last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT current_timestamp(0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT current_timestamp(0),
    nb_accounts INTEGER,
    nb_codes INTEGER,
    nb_accounts_strong INTEGER,
    nb_accounts_medium INTEGER,
    nb_accounts_weak INTEGER,
    nb_accounts_with_duplicated_password INTEGER,
    nb_accounts_with_no_password INTEGER,
    nb_accounts_red INTEGER,
    nb_accounts_orange INTEGER,
    nb_accounts_green INTEGER
  )`);
}

exports.down = function (db) {
  return db.query("DROP TABLE IF EXISTS shared_vaults");
}
