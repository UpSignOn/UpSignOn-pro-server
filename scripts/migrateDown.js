/* eslint-disable @typescript-eslint/no-var-requires */
var db = require('./dbMigrationConnect');
const { getLogDate } = require('./logDate');

(async function () {
  try {
    await db.connect();
    var res = await db.query(`SELECT name FROM migrations ORDER BY name desc LIMIT 1`);
    if (res.rowCount === 0) {
      console.log(getLogDate() + ': ' + 'No-migration to run');
      return;
    }

    var name = res.rows[0].name;
    console.log(getLogDate() + ': ' + 'Migration down: ' + name);
    var down = require('../migrations/' + name).down;
    await down(db);
    await db.query(`DELETE FROM migrations WHERE name=$1`, [name]);
  } catch (e) {
    console.error(getLogDate() + ': ' + e);
  } finally {
    await db.release();
    process.exit(0);
  }
})();
