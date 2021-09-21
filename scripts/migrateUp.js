/* eslint-disable @typescript-eslint/no-var-requires */
var fs = require('fs');
var db = require('./dbMigrationConnect');
var path = require('path');
const { getLogDate } = require('./logDate');

function getMigrationPromise(file) {
  return async function () {
    var up = require('../migrations/' + file).up;
    var existingMigration = { rowCount: 0 };
    try {
      existingMigration = await db.query('SELECT * from migrations WHERE name=$1', [file]);
    } catch {
      // db not yet initialized
    }

    if (existingMigration.rowCount === 0) {
      await up(db);
      await db.query('INSERT INTO migrations (name) VALUES ($1)', [file]);
      console.log(getLogDate() + ': ' + 'Migration ' + file);
    }
  };
}

fs.readdir(path.join(__dirname, '../migrations'), function (err, files) {
  var requests = files.sort().map(getMigrationPromise);
  requests
    .reduce(function (cur, next) {
      return cur.then(next);
    }, db.connect())
    .then(function () {
      console.log(getLogDate() + ': DONE updating database');
    })
    .catch(function (e) {
      console.error(getLogDate() + ': ' + e);
    })
    .finally(function () {
      db.release();
      process.exit(0);
    });
});
