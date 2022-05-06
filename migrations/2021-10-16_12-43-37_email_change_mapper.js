//2021-10-16_12-43-37_email_change_mapper

exports.up = function (db) {
  return db.query(
    'CREATE TABLE IF NOT EXISTS changed_emails (' +
      'old_email varchar(64) PRIMARY KEY,' +
      'new_email varchar(64),' +
      'user_id integer,' +
      "aware_devices JSON DEFAULT '[]'," +
      'created_at timestamp with time zone DEFAULT current_timestamp(0),' +
      'CONSTRAINT fk_user_id FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE' +
      ')',
  );
};

exports.down = function (db) {
  return db.query('DROP TABLE IF EXISTS changed_emails');
};
