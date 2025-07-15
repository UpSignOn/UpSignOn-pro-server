import { db } from './db';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { logError } from './logger';
import env from './env';

type SessionData = {
  userEmail: string;
  deviceUniqueId: string;
  groupId: number;
};
type OpenIdSessionData = {
  userEmail: string;
  groupId: number;
  accessToken: string;
};

async function cleanSessions() {
  try {
    await db.query('DELETE FROM device_sessions WHERE current_timestamp(0) > expiration_time');
  } catch (e) {
    logError('cleanSessions error', e);
  }
}

async function init() {
  try {
    await db.query(
      'CREATE TABLE IF NOT EXISTS device_sessions (session_id VARCHAR PRIMARY KEY, session_data JSON NOT NULL, expiration_time TIMESTAMP(0) NOT NULL)',
    );
  } catch (e) {
    logError(e);
    throw e;
  }
  setInterval(cleanSessions, 600000); // 10 minutes
}

function getSignedSession(sessionId: string): string {
  const secret = env.SESSION_SECRET;
  if (!secret) throw new Error('Missing SESSION_SECRET in .env file');
  return sessionId + '.' + crypto.createHmac('sha256', secret).update(sessionId).digest('base64');
}
async function createSession(sessionData: SessionData): Promise<string> {
  const newSessionId = uuidv4();
  const sessionDataString = JSON.stringify(sessionData);
  // nb do use postgres time manipulation instead of js time to avoid issues with server time
  await db.query(
    `INSERT INTO device_sessions (session_id, session_data, expiration_time) VALUES ($1, $2, current_timestamp(0)+interval '1 hour')`,
    [newSessionId, sessionDataString],
  );
  return getSignedSession(newSessionId);
}
async function createOpenIdSession(
  sessionData: OpenIdSessionData,
  expirationTimestamp: number | null,
): Promise<string> {
  const newSessionId = uuidv4();
  const sessionDataString = JSON.stringify(sessionData);

  if (expirationTimestamp) {
    // Utiliser PostgreSQL pour gérer l'expiration basée sur le timestamp fourni
    await db.query(
      `INSERT INTO device_sessions (session_id, session_data, expiration_time) VALUES ($1, $2, to_timestamp($3))`,
      [newSessionId, sessionDataString, expirationTimestamp],
    );
  } else {
    // Utiliser PostgreSQL pour gérer l'expiration par défaut (1 heure)
    await db.query(
      `INSERT INTO device_sessions (session_id, session_data, expiration_time) VALUES ($1, $2, current_timestamp(0)+interval '1 hour')`,
      [newSessionId, sessionDataString],
    );
  }

  return getSignedSession(newSessionId);
}

async function checkSession(
  untrustedSession: string,
  untrustedSessionData: SessionData,
): Promise<boolean> {
  if (typeof untrustedSession !== 'string') return false;
  const sessionId = untrustedSession.split('.')[0];
  if (untrustedSession !== getSignedSession(sessionId)) return false;
  // nb do use postgres time manipulation instead of js time to avoid issues with server time
  const res = await db.query(
    'SELECT session_data FROM device_sessions WHERE session_id = $1::text AND current_timestamp(0) <= expiration_time',
    [sessionId],
  );
  if (res.rowCount === 0) {
    return false;
  }
  const expectedSessionData = res.rows[0].session_data;
  return (
    expectedSessionData.userEmail === untrustedSessionData.userEmail &&
    expectedSessionData.deviceUniqueId === untrustedSessionData.deviceUniqueId &&
    expectedSessionData.groupId === untrustedSessionData.groupId
  );
}
async function checkOpenIdSession(
  untrustedSession: string,
  untrustedSessionData: { userEmail: string; groupId: number },
): Promise<boolean> {
  if (typeof untrustedSession !== 'string') return false;
  const sessionId = untrustedSession.split('.')[0];
  if (untrustedSession !== getSignedSession(sessionId)) return false;
  // nb do use postgres time manipulation instead of js time to avoid issues with server time
  const res = await db.query(
    'SELECT session_data FROM device_sessions WHERE session_id = $1::text AND current_timestamp(0) <= expiration_time',
    [sessionId],
  );
  if (res.rowCount === 0) {
    return false;
  }
  const expectedSessionData = res.rows[0].session_data;
  return (
    expectedSessionData.userEmail === untrustedSessionData.userEmail &&
    expectedSessionData.groupId === untrustedSessionData.groupId
  );
}

async function disconnectSession(untrustedSession: string) {
  if (typeof untrustedSession !== 'string') return null;
  const sessionId = untrustedSession.split('.')[0];
  if (untrustedSession !== getSignedSession(sessionId)) return null;
  await db.query('DELETE FROM device_sessions WHERE session_id = $1', [sessionId]);
}

export const SessionStore = {
  init,
  createSession,
  createOpenIdSession,
  checkSession,
  checkOpenIdSession,
  disconnectSession,
};
