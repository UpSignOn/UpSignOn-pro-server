//2023-05-31_09-28-56_audit-track

exports.up = function (db) {
  return db.query(`CREATE TABLE IF NOT EXISTS event_logs (
    device_id INTEGER NOT NULL,
    user_email VARCHAR(64) NOT NULL,
    admin_email VARCHAR(64),
    event TEXT NOT NULL,
    date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP(0),
    group_id INTEGER
  )`);
}

exports.down = function (db) {
  return db.query("DROP TABLE IF EXISTS event_logs");
}
