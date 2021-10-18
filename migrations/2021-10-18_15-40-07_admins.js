//2021-10-18_15-40-07_admins

exports.up = function (db) {
  return db.query(`
  CREATE TABLE IF NOT EXISTS admins
  (
    id UUID PRIMARY KEY,
    email VARCHAR(64) UNIQUE,
    password_hash VARCHAR(60),
    token UUID,
    token_expires_at timestamp(0) WITHOUT TIME ZONE,
    created_at timestamp(0) WITHOUT TIME ZONE DEFAULT current_timestamp(0)
  )`);
};

exports.down = function (db) {
  return db.query('DROP TABLE IF EXISTS admins');
};
