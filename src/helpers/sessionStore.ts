import { db } from './db';
import expressSession from 'express-session';
import { logError } from './logger';

const tenMinutes = 600; // seconds

export default class PostgreSQLSessionStore extends expressSession.Store {
  constructor() {
    super();
    this.createTable();
    setInterval(this.dbCleanup, tenMinutes * 1000);
  }

  createTable = async (): Promise<void> => {
    try {
      await db.query(
        'CREATE TABLE IF NOT EXISTS device_sessions (session_id VARCHAR PRIMARY KEY, session_data JSON NOT NULL, expiration_time TIMESTAMP(0) NOT NULL)',
      );
    } catch (e) {
      logError(e);
      throw e;
    }
  };

  getExpireDate = (maxAgeMillis?: number): Date => {
    const expireDate = new Date();
    expireDate.setTime(expireDate.getTime() + (maxAgeMillis || 3600000));
    return expireDate;
  };

  dbCleanup = async (): Promise<void> => {
    try {
      await db.query('DELETE FROM device_sessions WHERE current_timestamp(0) > expiration_time');
    } catch (e) {
      logError('sessionStore', 'dbCleanup', e);
    }
  };
  get = async (
    sid: string,
    cb: (err?: any, session?: expressSession.SessionData | null) => void,
  ): Promise<void> => {
    try {
      const res = await db.query(
        'SELECT session_data FROM device_sessions WHERE session_id = $1::text AND current_timestamp(0) <= expiration_time',
        [sid],
      );
      if (res.rowCount === 0) {
        return cb();
      }
      return cb(null, res.rows[0].session_data);
    } catch (e) {
      logError('sessionStore', 'get', e);
      cb(e);
    }
  };

  set = async (
    sid: string,
    sessionData: expressSession.Session,
    cb?: (err?: any) => void,
  ): Promise<void> => {
    const expires: Date =
      sessionData.cookie.expires || this.getExpireDate(sessionData.cookie.maxAge);
    try {
      await db.query(
        'INSERT INTO device_sessions (session_id, session_data, expiration_time) VALUES ($1, $2, to_timestamp($3)) ON CONFLICT (session_id) DO UPDATE SET session_data=$2, expiration_time=to_timestamp($3)',
        [sid, JSON.stringify(sessionData), Math.trunc(expires.getTime() / 1000)],
      );
      if (cb) cb();
    } catch (e) {
      logError('sessionStore', 'set', e);
      if (cb) cb(e);
    }
  };
  destroy = async (sid: string, cb?: (err?: any) => void): Promise<void> => {
    try {
      await db.query('DELETE FROM device_sessions WHERE session_id = $1', [sid]);
      if (cb) cb();
    } catch (e) {
      logError('sessionStore', 'destroy', e);
      if (cb) cb(e);
    }
  };

  clear = async (cb?: (err?: any) => void): Promise<void> => {
    try {
      await db.query('TRUNCATE device_sessions');
      if (cb) cb();
    } catch (e) {
      logError('sessionStore', 'clear', e);
      if (cb) cb(e);
    }
  };

  touch = async (
    sid: string,
    sessionData: expressSession.Session,
    cb?: (err?: any) => void,
  ): Promise<void> => {
    const expires: Date =
      sessionData.cookie.expires || this.getExpireDate(sessionData.cookie.maxAge);
    try {
      await db.query(
        'UPDATE device_sessions SET expiration_time=to_timestamp($1) WHERE session_id = $2',
        [Math.trunc(expires.getTime() / 1000), sid],
      );
      if (cb) cb();
    } catch (e) {
      logError('sessionStore', 'touch', e);
      if (cb) cb(e);
    }
  };
}
