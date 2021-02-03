//2021-02-03_14-25-45_user-devices

exports.up = function (db) {
  return db.query(
    'CREATE TABLE user_devices (' +
      'id SERIAL PRIMARY KEY,' +
      'user_id integer,' +
      'device_name varchar(64),' +
      'device_unique_id varchar(64),' +
      'access_code_hash varchar(60),' +
      'authorization_status varchar(60),' +
      'authorization_code varchar(32),' +
      'created_at timestamp without time zone DEFAULT current_timestamp(0)' +
      ')',
  );
};

exports.down = function (db) {
  return db.query('DROP TABLE users');
};
