//2021-03-16_15-30-24_sharingPublicKey

exports.up = function (db) {
  return db.query('ALTER TABLE users ADD COLUMN sharing_public_key VARCHAR(400)');
};

exports.down = function (db) {
  return db.query('ALTER TABLE users DROP COLUMN sharing_public_key');
};
