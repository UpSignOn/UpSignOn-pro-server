//2021-03-30_15-26-21_usage-logs

exports.up = function (db) {
  return db.query(
    'CREATE TABLE IF NOT EXISTS usage_logs (' +
      'id SERIAL PRIMARY KEY,' +
      'device_id INTEGER,' +
      'date timestamp with time zone DEFAULT current_timestamp(0),' +
      'log_type VARCHAR(50)' +
      ')',
  );
};

exports.down = function (db) {
  return db.query('DROP TABLE IF EXISTS usage_logs');
};
