//2021-10-07_18-07-44_add_cascades_pwd_reset

exports.up = function (db) {
  return db.query(
    'ALTER TABLE password_reset_request DROP CONSTRAINT pwd_reset_device_id, ADD CONSTRAINT pwd_reset_device_id FOREIGN KEY (device_id) REFERENCES user_devices(id) ON DELETE CASCADE',
  );
};

exports.down = function (db) {
  return db.query(
    'ALTER TABLE password_reset_request DROP CONSTRAINT pwd_reset_device_id, ADD CONSTRAINT pwd_reset_device_id FOREIGN KEY (device_id) REFERENCES user_devices(id)',
  );
};
