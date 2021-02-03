var { Client } = require('pg');

try {
  var db = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    database: process.env.DB_NAME,
    password: process.env.DB_PASS,
  });
} catch (e) {
  console.error(e);
}

module.exports = {
  connect: function () {
    return db.connect();
  },
  query: function (text, params) {
    return db.query(text, params);
  },
  release: function () {
    return db.end();
  },
};
