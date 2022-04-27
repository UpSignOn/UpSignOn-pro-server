import crypto from 'crypto';
import { db } from './db';

export const createDeviceChallenge = async (deviceId: string): Promise<string> => {
  const deviceChallenge = crypto.randomBytes(16).toString('base64');
  await db.query(
    "UPDATE user_devices SET session_auth_challenge=$1, session_auth_challenge_exp_time= current_timestamp(0)+interval '3 minutes' WHERE id=$2",
    [deviceChallenge, deviceId],
  );
  return deviceChallenge;
};

export const checkDeviceChallenge = (
  challenge: string,
  challengeResponse: string,
  devicePublicKey: string,
): boolean => {
  const publicKey = Buffer.from(devicePublicKey, 'base64');
  const deviceChallenge = Buffer.from(challenge, 'base64');
  const deviceChallengeResponseBytes = Buffer.from(challengeResponse, 'base64');
  const hasPassedDeviceChallenge = crypto.verify(
    'RSA_PKCS1_PADDING',
    deviceChallenge,
    publicKey,
    deviceChallengeResponseBytes,
  );
  return hasPassedDeviceChallenge;
};
