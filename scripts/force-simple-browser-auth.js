const path = require('path');
const db = require(path.join(__dirname, './dbMigrationConnect'));

async function forceSimpleBrowserAuth() {
  try {
    await db.connect();
    const groups = await db.query('SELECT * FROM groups');
    for (let i = 0; i < groups.rows.length; i++) {
      let g = groups.rows[i];
      let settings = g.settings;
      settings.ALLOW_UNSAFE_BROWSER_SETUP = true;
      await db.query('UPDATE groups SET settings=$1 WHERE id=$2', [settings, g.id]);
    }
    await db.release();
  } catch (e) {
    console.log(e);
  }
}

forceSimpleBrowserAuth();
