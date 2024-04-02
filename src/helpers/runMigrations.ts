/* eslint-disable @typescript-eslint/no-var-requires */
import path from 'path';
import fs from 'fs';
import { db } from './db';
import { logInfo } from './logger';
import { QueryResult } from 'pg';

export const runMigrations = async () => {
  const files = await fs.promises.readdir(path.join(__dirname, '../../migrations'));
  try {
    const requests = files.sort().map(getMigrationPromise);
    await requests.reduce(function (cur, next) {
      return cur.then(next);
    }, Promise.resolve());
    console.log('DONE updating database');
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
};

function getMigrationPromise(file: any) {
  return async function () {
    const up = require('../../migrations/' + file).up;
    let existingMigration: QueryResult = { rowCount: 0, rows: [], command: '', oid: 0, fields: [] };
    try {
      existingMigration = await db.query('SELECT * from migrations WHERE name=$1', [file]);
    } catch {
      // db not yet initialized
    }

    if (existingMigration.rowCount === 0) {
      await up(db);
      await db.query('INSERT INTO migrations (name) VALUES ($1)', [file]);
      logInfo('Migration ' + file);
    }
  };
}
