//2021-10-07_18-12-30_add_cascades_device

exports.up = function (db) {
  return db.query(
    'ALTER TABLE user_devices DROP CONSTRAINT fk_user_id, ADD CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE',
  );
};

exports.down = function (db) {
  return db.query(
    'ALTERs DROP CONSTRAINT fk_user_id, ADD CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES users(id)',
  );
};
