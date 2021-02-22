//2021-02-22_16-41-28_url_list

exports.up = function (db) {
  return db.query(
    'CREATE TABLE IF NOT EXISTS url_list (' +
      'displayed_name varchar(64) UNIQUE NOT NULL,' +
      'signin_url varchar(64),' +
      'password_change_url varchar(64)' +
      ')',
  );
};

exports.down = function (db) {
  return db.query('DROP TABLE IF EXISTS url_list');
};
