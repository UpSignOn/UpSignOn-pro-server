//2023-05-23_20-45-37_create_shared_vault_recipients

exports.up = function (db) {
  return db.query(`CREATE TABLE IF NOT EXISTS shared_vault_recipients (
    shared_vault_id INTEGER REFERENCES shared_vaults(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    encrypted_shared_vault_key TEXT,
    is_manager BOOLEAN,
    group_id SMALLINT REFERENCES groups(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT current_timestamp(0),
    PRIMARY KEY (shared_vault_id, user_id)
  )
  `);
}

exports.down = function (db) {
  return db.query("DROP TABLE IF EXISTS shared_vault_recipients");
}
