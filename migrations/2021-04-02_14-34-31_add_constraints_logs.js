//2021-04-02_14-34-31_add_constraints_logs

exports.up = function (db) {
  return db.query(
    'ALTER TABLE usage_logs ADD CONSTRAINT log_device_id FOREIGN KEY(device_id) REFERENCES user_devices(id)',
  );
};

exports.down = function (db) {
  return db.query('ALTER TABLE usage_logs DROP CONSTRAINT log_device_id');
};
