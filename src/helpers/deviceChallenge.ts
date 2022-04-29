import crypto from 'crypto';
import { db } from './db';
import { accessCodeHash } from '../helpers/accessCodeHash';

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

export const checkDeviceRequestAuthorization = async (
  deviceAccessCode: null | string,
  expectedAccessCodeHash: null | string,
  deviceChallengeResponse: null | string,
  deviceId: string,
  sessionAuthChallengeExpTime: null | Date,
  sessionAuthChallenge: null | string,
  devicePublicKey: string,
): Promise<boolean> => {
  if (!deviceAccessCode && !deviceChallengeResponse) {
    return false;
  }

  if (!!deviceChallengeResponse) {
    if (sessionAuthChallengeExpTime && sessionAuthChallengeExpTime.getTime() < Date.now()) {
      return false;
    }
    if (!sessionAuthChallenge) {
      return false;
    }
    const hasPassedDeviceChallenge = checkDeviceChallenge(
      sessionAuthChallenge,
      deviceChallengeResponse,
      devicePublicKey,
    );
    if (!hasPassedDeviceChallenge) {
      return false;
    }

    // if device is authenticated, cleanup db
    await db.query(
      'UPDATE user_devices SET session_auth_challenge=null, session_auth_challenge_exp_time=null WHERE id=$1',
      [deviceId],
    );
    return true;
  }

  if (!!deviceAccessCode) {
    if (!expectedAccessCodeHash) {
      return false;
    }
    // Check access code
    const isAccessGranted = await accessCodeHash.asyncIsOk(
      deviceAccessCode,
      expectedAccessCodeHash,
    );
    return isAccessGranted;
  }

  return false;
};
