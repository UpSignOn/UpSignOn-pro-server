import crypto from 'crypto';
import { db } from '../../helpers/db';
import { accessCodeHash } from './accessCodeHash';
import { checkDeviceChallengeV2 } from '../../api2/helpers/deviceChallengev2';

export const createDeviceChallengeV1 = async (deviceId: Number): Promise<string> => {
  const deviceChallenge = crypto.randomBytes(16).toString('base64');
  const updateRes = await db.query(
    "UPDATE user_devices SET session_auth_challenge=$1, session_auth_challenge_exp_time=current_timestamp(0)+interval '3 minutes' WHERE id=$2",
    [deviceChallenge, deviceId],
  );
  if (updateRes.rowCount !== 1) {
    throw new Error('Create device challenge db update error.');
  }
  return deviceChallenge;
};

export const checkDeviceChallengeV1 = async (
  challenge: string,
  challengeResponse: string,
  devicePublicKey: string,
): Promise<boolean> => {
  try {
    if(devicePublicKey.length == 44) {
      return checkDeviceChallengeV2(challenge, challengeResponse, devicePublicKey);
    }
    const publicKey = Buffer.from(devicePublicKey, 'base64');
    const deviceChallenge = Buffer.from(challenge, 'base64');
    const deviceChallengeResponseBytes = Buffer.from(challengeResponse, 'base64');

    // @ts-ignore
    const key = await crypto.webcrypto.subtle.importKey(
      'spki',
      publicKey,
      {
        hash: 'SHA-256',
        name: 'RSA-PSS',
      },
      false,
      ['verify'],
    );
    let hasPassedDeviceChallenge = crypto.verify(
      'RSA-SHA256',
      deviceChallenge,
      {
        // @ts-ignore
        key,
        padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
        saltLength: crypto.constants.RSA_PSS_SALTLEN_AUTO,
      },
      deviceChallengeResponseBytes,
    );

    if (!hasPassedDeviceChallenge) {
      // try ios 10 fallback with pkcs1.5 SHA256
      // @ts-ignore
      const fallbackKey = await crypto.webcrypto.subtle.importKey(
        'spki',
        publicKey,
        {
          hash: 'SHA-256',
          name: 'RSASSA-PKCS1-v1_5',
        },
        false,
        ['verify'],
      );

      hasPassedDeviceChallenge = crypto.verify(
        'RSA-SHA256',
        deviceChallenge,
        {
          // @ts-ignore
          key: fallbackKey,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        },
        deviceChallengeResponseBytes,
      );
    }
    return hasPassedDeviceChallenge;
  } catch (e) {
    return false;
  }
};

export const checkDeviceRequestAuthorizationV1 = async (
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
    if (!sessionAuthChallenge) {
      return false;
    }
    if (!sessionAuthChallengeExpTime || sessionAuthChallengeExpTime.getTime() < Date.now()) {
      return false;
    }
    const hasPassedDeviceChallenge = await checkDeviceChallengeV1(
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
