//2023-12-13_14-28-09_remove_usage_logs

exports.up = async function (db) {
  await db.query(
    'UPDATE user_devices SET last_sync_date = (SELECT date FROM usage_logs WHERE device_id=user_devices.id ORDER BY date DESC LIMIT 1)',
  );
  await db.query('DROP TABLE IF EXISTS usage_logs');
};

exports.down = async function (db) {
  await db.query(
    'CREATE TABLE IF NOT EXISTS usage_logs (' +
      'id SERIAL PRIMARY KEY,' +
      'device_id INTEGER,' +
      'date timestamp with time zone DEFAULT current_timestamp(0),' +
      'log_type VARCHAR(50),' +
      'group_id SMALLINT NOT NULL' +
      ')',
  );
  await db.query(
    'ALTER TABLE usage_logs ADD CONSTRAINT IF NOT EXISTS log_device_id FOREIGN KEY (device_id) REFERENCES user_devices(id) ON DELETE CASCADE, ADD CONSTRAINT IF NOT EXISTS fk_usage_logs_group FOREIGN KEY(group_id) REFERENCES groups(id) ON DELETE CASCADE',
  );
};
