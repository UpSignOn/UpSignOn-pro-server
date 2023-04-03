/* eslint-disable @typescript-eslint/no-var-requires */
import path from 'path';
import fs from 'fs';
import { db } from './db';
import { logInfo } from './logger'

export const runMigrations = () => {
    fs.readdir(path.join(__dirname, '../../migrations'), async function (err, files) {
        try {
            var requests = files.sort().map(getMigrationPromise);
            await requests
                .reduce(function (cur, next) {
                    return cur.then(next);
                }, Promise.resolve());
            console.log("DONE updating database");
        } catch (e) {
            console.error(e);
            process.exit(0);
        }
    });
}

function getMigrationPromise(file: any) {
    return async function () {
        var up = require('../../migrations/' + file).up;
        var existingMigration = { rowCount: 0 };
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

