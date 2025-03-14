//2025-03-13_11-32-46_shamir

exports.up = async function (db) {
  await db.query(
    `CREATE TABLE IF NOT EXISTS shamir_configs (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        min_shares SMALLINT NOT NULL DEFAULT 3,
        is_active BOOLEAN NOT NULL DEFAULT true,
        user_level SMALLINT,
        group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
        updated_at TIMESTAMP WITH TIMEZONE DEFAULT current_timestamp(0)
    )`,
  );
  await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS shamir_level SMALLINT`);

  // shamir_recipients needs a primary key because when someone is removed from the recipients list,
  // then its shares must also be removed, so we need a cascadable reference
  // udpated_at will let us understand inconsistencies between configs and recipients number of shares
  await db.query(
    `CREATE TABLE IF NOT EXISTS shamir_recipients (
        id SERIAL PRIMARY KEY,
        shamir_config_id INTEGER REFERENCES shamir_config(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES user(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIMEZONE DEFAULT current_timestamp(0),
        CONSTRAINT unique_recipient_per_config UNIQUE(shamir_config_id, user_id)
    )`,
  );
  await db.query(
    `CREATE TABLE IF NOT EXISTS shamir_shares (
        user_id INTEGER REFERENCES user(id) ON DELETE CASCADE,
        shamir_recipient_id INTEGER REFERENCES shamir_recipients(id) ON DELETE CASCADE,
        encrypted_share TEXT NOT NULL,
        encrypted_approved_share TEXT,
        updated_at TIMESTAMP WITH TIMEZONE DEFAULT current_timestamp(0),
        PRIMARY KEY(user_id, shamir_recipient_id)
    )`,
  );
  await db.query(
    `CREATE TABLE IF NOT EXISTS shamir_recovery_requests (
        id SERIAL PRIMARY KEY,
        shamir_config_id INTEGER REFERENCES shamir_config(id) ON DELETE CASCADE,
        device_id INTEGER REFERENCES user_devices(id),
        created_at TIMESTAMP WITH TIMEZONE DEFAULT CURRENT_TIMESTAMP(0),
        completed_at TIMESTAMP WITH TIMEZONE DEFAULT null,
        status VARCHAR(100)
    )`,
  );
};

exports.down = function (db) {
  return db.query();
};
