import crypto from 'crypto';
import { Buffer } from 'buffer';
import { db } from '../helpers/connection';
import { logError } from '../helpers/logger';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const getAuthenticationChallenges = async (req: any, res: any) => {
  try {
    const deviceId = req.body?.deviceId;
    let userEmail = req.body?.userEmail;
    const groupId = parseInt(req.params.groupId || 1);

    if (!userEmail || typeof userEmail !== 'string' || !deviceId) {
      return res.status(401).end();
    }
    userEmail = userEmail.toLowerCase();

    const dbRes = await db.query(
      `SELECT
        u.encrypted_data AS encrypted_data,
        char_length(ud.access_code_hash) > 0 AS has_access_code_hash,
        char_length(ud.device_public_key) > 0 AS has_device_public_key
      FROM user_devices AS ud
      INNER JOIN users AS u ON ud.user_id = u.id
      WHERE
        u.email=$1
        AND ud.device_unique_id = $2
        AND ud.authorization_status='AUTHORIZED'
        AND u.group_id=$3
      `,
      [userEmail, deviceId, groupId],
    );

    if (!dbRes || dbRes.rowCount === 0) return res.status(401).end();
    if (dbRes.rows[0].has_access_code_hash || !dbRes.rows[0].has_device_public_key)
      return res.status(401).end();
    let data = dbRes.rows[0].encrypted_data;
    if (!data.startsWith('formatP001-')) {
      return res.status(401).end();
    }
    data = data.replace('formatP001-', '');
    const dataBuffer = Buffer.from(data, 'base64'); // dataBuffer = [challenge(16 bytes) | challengeHash(32 bytes) | cipherSignature(32 bytes) | derivationKeySalt(64 bytes) | iv(16 bytes) | cipher(?)]

    const pwdChallenge = Buffer.alloc(16);
    dataBuffer.copy(pwdChallenge, 0, 0, 16);
    const pwdChallengeBase64 = pwdChallenge.toString('base64');

    const keySalt = Buffer.alloc(64);
    dataBuffer.copy(pwdChallenge, 0, 80, 144);
    const keySaltBase64 = keySalt.toString('base64');

    const deviceChallenge = crypto.randomBytes(16).toString('base64');
    await db.query(
      "UPDATE user_devices SET session_auth_challenge=$1, session_auth_challenge_exp_time= current_timestamp(0)+interval '3 minutes' WHERE device_unique_id=$2 AND group_id=$3",
    );

    return res.status(200).json({
      passwordChallenge: pwdChallengeBase64,
      keySalt: keySaltBase64,
      deviceChallenge,
    });
  } catch (e) {
    logError('getAuthenticationChallenges', e);
    return res.status(400).end();
  }
};
