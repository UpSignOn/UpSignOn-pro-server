exports.up = function (db) {
  return db.query(
    'CREATE TABLE IF NOT EXISTS migrations (name varchar(255) NOT NULL, migration_time timestamp with time zone DEFAULT current_timestamp(0))',
  );
};

exports.down = function (db) {
  return db.query('DROP TABLE migrations');
};
