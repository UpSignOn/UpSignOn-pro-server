//2022-04-08_18-42-45_remove_size_constraint_sharing_public_key

exports.up = function (db) {
  return db.query('ALTER TABLE users ALTER COLUMN sharing_public_key TYPE TEXT');
};

exports.down = function (db) {
  return;
};
