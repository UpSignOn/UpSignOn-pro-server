//2021-03-11_10-00-42_password-reset-request

exports.up = function (db) {
  return db.query(
    'CREATE TABLE IF NOT EXISTS password_reset_request (' +
      'id SERIAL PRIMARY KEY,' +
      'device_id INTEGER,' +
      'status varchar(32),' +
      'reset_token varchar(8),' +
      'reset_token_expiration_date timestamptz,' +
      'created_at timestamp with time zone DEFAULT current_timestamp(0)' +
      ')',
  );
};

exports.down = function (db) {
  return db.query('DROP TABLE IF EXISTS password_reset_request');
};
