//2021-02-18_23-23-17_add_update_date

exports.up = function (db) {
  return db.query(
    'ALTER TABLE users ADD updated_at timestamp without time zone DEFAULT current_timestamp(0)',
  );
};

exports.down = function (db) {
  return db.query('ALTER TABLE users DROP updated_at');
};
