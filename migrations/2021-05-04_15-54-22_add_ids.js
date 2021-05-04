//2021-05-04_15-54-22_add_ids

exports.up = function (db) {
  return db.query('ALTER TABLE allowed_emails ADD id SERIAL PRIMARY KEY').then(() => {
    return db.query('ALTER TABLE url_list ADD id SERIAL PRIMARY KEY');
  });
};

exports.down = function (db) {
  return db.query('ALTER TABLE allowed_emails DROP id').then(() => {
    // return db.query('ALTER TABLE allowed_emails DROP id');
  });
};
