import crypto from 'crypto';
import { db } from './db';

export const createPasswordChallenge = (
  encryptedDataString: string,
): { pwdChallengeBase64: string; keySaltBase64: string } => {
  if (!encryptedDataString.startsWith('formatP001-')) {
    throw new Error('Cannot get password challenge from old data format');
  }
  // data = [challengeBase64(24 chars) | challengeHashBase64(44 chars) | cipherSignatureBase64(44 chars) | derivationKeySaltBase64(88 chars) | ivBase64(24 chars) | cipherBase64(?)]
  const pwdChallengeBase64 = encryptedDataString.substring(11, 35);
  const keySaltBase64 = encryptedDataString.substring(123, 211);

  return { pwdChallengeBase64, keySaltBase64 };
};

export const checkPasswordChallenge = async (
  encryptedData: string,
  passwordChallengeResponse: string,
  passwordErrorCount: number,
  deviceId: string,
  groupId: number,
): Promise<boolean> => {
  if (!encryptedData.startsWith('formatP001-')) {
    return false;
  }
  // data = [challengeBase64(24 chars) | challengeHashBase64(44 chars) | cipherSignatureBase64(44 chars) | derivationKeySaltBase64(88 chars) | ivBase64(24 chars) | cipherBase64(?)]
  const expectedPwdChallengeResult = Buffer.from(encryptedData.substring(35, 79), 'base64');
  const passwordChallengeResponseBuffer = Buffer.from(passwordChallengeResponse, 'base64');

  let hasPassedPasswordChallenge = false;

  try {
    hasPassedPasswordChallenge = crypto.timingSafeEqual(
      expectedPwdChallengeResult,
      passwordChallengeResponseBuffer,
    );
  } catch (e) {}

  // Add a time constraint to the number of failed attempts per device
  if (!hasPassedPasswordChallenge) {
    // 3 attempts with no delay, then 1 minute for each additional previous failed attempt
    if (passwordErrorCount <= 2) {
      await db.query(
        'UPDATE user_devices SET password_challenge_error_count=password_challenge_error_count+1, password_challenge_blocked_until=null WHERE id=$1 AND group_id=$2',
        [deviceId, groupId],
      );
    } else {
      const minRetryDate = new Date();
      minRetryDate.setTime(Date.now() + 60 * (passwordErrorCount - 2) * 1000);
      await db.query(
        'UPDATE user_devices SET password_challenge_error_count=password_challenge_error_count+1, password_challenge_blocked_until=$1 WHERE id=$2 AND group_id=$3',
        [minRetryDate.toISOString(), deviceId, groupId],
      );
    }
  }

  return hasPassedPasswordChallenge;
};
