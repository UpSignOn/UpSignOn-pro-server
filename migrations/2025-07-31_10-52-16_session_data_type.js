//2025-07-31_10-52-16_session_data_type

exports.up = function (db) {
  return db.query('ALTER TABLE admin_sessions ALTER COLUMN session_data TYPE jsonb');
};

exports.down = function (db) {};
