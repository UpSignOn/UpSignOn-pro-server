import { db } from '../../helpers/db';
import libsodium from 'libsodium-wrappers';


export const createDeviceChallengeV2 = async (deviceId: Number): Promise<string> => {
  const deviceChallenge = libsodium.to_base64(libsodium.randombytes_buf(16));
  const updateRes = await db.query(
    "UPDATE user_devices SET session_auth_challenge=$1, session_auth_challenge_exp_time=current_timestamp(0)+interval '3 minutes' WHERE id=$2",
    [deviceChallenge, deviceId],
  );
  if (updateRes.rowCount !== 1) {
    throw new Error('Create device challenge db update error.');
  }
  return deviceChallenge;
};

export const checkDeviceChallengeV2 = async (
  challenge: string,
  challengeResponse: string,
  devicePublicKey: string,
): Promise<boolean> => {
  try {
    const publicKey = libsodium.from_base64(devicePublicKey);
    const deviceChallenge = libsodium.from_base64(challenge);
    const deviceChallengeResponseBytes = libsodium.from_base64(challengeResponse);
    const unsignedChallengeResponse = libsodium.crypto_sign_open(deviceChallengeResponseBytes, publicKey);
    return libsodium.memcmp(deviceChallenge, unsignedChallengeResponse);
  } catch (e) {
    return false;
  }
};

export const checkDeviceRequestAuthorizationV2 = async (
  deviceChallengeResponse: string,
  deviceId: string,
  sessionAuthChallengeExpTime: null | Date,
  sessionAuthChallenge: null | string,
  devicePublicKey: string,
): Promise<boolean> => {
  if (!sessionAuthChallenge) {
    return false;
  }
  if (!sessionAuthChallengeExpTime || sessionAuthChallengeExpTime.getTime() < Date.now()) {
    return false;
  }
  const hasPassedDeviceChallenge = await checkDeviceChallengeV2(
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
};
