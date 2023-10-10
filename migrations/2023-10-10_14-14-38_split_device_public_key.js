//2023-10-10_14-14-38_split_device_public_key

exports.up = async function (db) {
  await db.query('ALTER TABLE user_devices ADD COLUMN IF NOT EXISTS device_public_key_2 TEXT');
  await db.query('UPDATE user_devices SET device_public_key_2=device_public_key');
};

exports.down = function (db) {
  return db.query('ALTER TABLE user_devices DROP COLUMN IF EXISTS device_public_key_2');
};
