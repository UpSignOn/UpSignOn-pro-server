//2021-04-02_14-34-25_add_constraints_pwd_reset

exports.up = function (db) {
  return db.query(
    'ALTER TABLE password_reset_request ADD CONSTRAINT pwd_reset_device_id FOREIGN KEY(device_id) REFERENCES user_devices(id)',
  );
};

exports.down = function (db) {
  return db.query('ALTER TABLE password_reset_request DROP CONSTRAINT pwd_reset_device_id');
};
