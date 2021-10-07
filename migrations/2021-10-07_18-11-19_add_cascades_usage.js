//2021-10-07_18-11-19_add_cascades_usage

exports.up = function (db) {
  return db.query(
    'ALTER TABLE usage_logs DROP CONSTRAINT log_device_id, ADD CONSTRAINT log_device_id FOREIGN KEY (device_id) REFERENCES user_devices(id) ON DELETE CASCADE',
  );
};

exports.down = function (db) {
  return db.query(
    'ALTER TABLE usage_logs DROP CONSTRAINT log_device_id, ADD CONSTRAINT log_device_id FOREIGN KEY (device_id) REFERENCES user_devices(id)',
  );
};
