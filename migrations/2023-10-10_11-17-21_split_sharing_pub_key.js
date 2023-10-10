//2023-10-10_11-17-21_split_sharing_pub_key

exports.up = async function (db) {
  await db.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS sharing_public_key_2 TEXT');
  await db.query('UPDATE users SET sharing_public_key_2 = sharing_public_key');
};

exports.down = async function (db) {
  await db.query('ALTER TABLE users DROP COLUMN IF EXISTS sharing_public_key_2');
};
