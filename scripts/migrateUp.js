var fs = require('fs');
var db = require('./dbMigrationConnect');
var path = require('path');

function getMigrationPromise(file, index) {
  return async function () {
    var up = require('../migrations/' + file).up;
    if (index === 0) {
      console.log('Migrating ' + file);
      await up(db);
      return;
    }
    var res = await db.query(`SELECT * from migrations WHERE name='${file}'`);
    if (res.rowCount === 0) {
      await up(db);
      await db.query(`INSERT INTO migrations (name) VALUES ('${file}')`);
      console.log('Migration ' + file);
    }
  };
}

fs.readdir(path.join(__dirname, '../migrations'), function (err, files) {
  var requests = files.sort().map(getMigrationPromise);
  requests
    .reduce(function (cur, next) {
      return cur.then(next);
    }, db.connect())
    .catch(function (e) {
      console.error('error : ', e);
    })
    .finally(function () {
      db.release();
      process.exit(0);
    });
});
