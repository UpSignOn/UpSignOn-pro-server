/* eslint-disable @typescript-eslint/no-var-requires */
var fs = require('fs');
var db = require('./dbMigrationConnect');

(async function () {
  try {
    await db.connect();
    var res = await db.query(`SELECT name FROM migrations ORDER BY name desc LIMIT 1`);
    if (res.rowCount === 0) {
      console.log('No-migration to run');
      return;
    }

    var name = res.rows[0].name;
    console.log('Migration down: ' + name);
    var down = require('../migrations/' + name).down;
    await down(db);
    await db.query(`DELETE FROM migrations WHERE name='$1'`, [name]);
  } catch (e) {
    console.error(e);
  } finally {
    await db.release();
    process.exit(0);
  }
})();
