//2021-02-03_14-25-45_user-devices

exports.up = function (db) {
  return db.query(
    'CREATE TABLE IF NOT EXISTS user_devices (' +
      'id SERIAL PRIMARY KEY,' +
      'user_id integer,' +
      'device_name varchar(64),' +
      'device_unique_id uuid,' +
      'access_code_hash varchar(60),' +
      'authorization_status varchar(64),' +
      'authorization_code uuid,' +
      'auth_code_expiration_date timestamptz,' +
      'created_at timestamp without time zone DEFAULT current_timestamp(0),' +
      'CONSTRAINT fk_user_id FOREIGN KEY(user_id) REFERENCES users(id)' +
      ')',
  );
};

exports.down = function (db) {
  return db.query('DROP TABLE IF EXISTS user_devices');
};
