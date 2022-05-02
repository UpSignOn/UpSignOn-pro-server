import { Buffer } from 'buffer';
import crypto from 'crypto';
import { db } from './db';

export const createPasswordChallenge = (
  encryptedDataString: string,
): { pwdChallengeBase64: string; keySaltBase64: string } => {
  let data = encryptedDataString;
  if (!data.startsWith('formatP001-')) {
    throw new Error('Cannot get password challenge from old data format');
  }
  data = data.replace('formatP001-', '');
  const dataBuffer = Buffer.from(data, 'base64'); // dataBuffer = [challenge(16 bytes) | challengeHash(32 bytes) | cipherSignature(32 bytes) | derivationKeySalt(64 bytes) | iv(16 bytes) | cipher(?)]

  const pwdChallenge = Buffer.alloc(16);
  dataBuffer.copy(pwdChallenge, 0, 0, 16);
  const pwdChallengeBase64 = pwdChallenge.toString('base64');

  const keySalt = Buffer.alloc(64);
  dataBuffer.copy(keySalt, 0, 80, 144);
  const keySaltBase64 = keySalt.toString('base64');

  return { pwdChallengeBase64, keySaltBase64 };
};

export const checkPasswordChallenge = async (
  encryptedData: string,
  passwordChallengeResponse: string,
  passwordErrorCount: number,
  deviceId: string,
  groupId: number,
): Promise<boolean> => {
  let data = encryptedData;
  if (!data.startsWith('formatP001-')) {
    return false;
  }
  data = data.replace('formatP001-', '');
  const dataBuffer = Buffer.from(data, 'base64'); // dataBuffer = [challenge(16 bytes) | challengeHash(32 bytes) | cipherSignature(32 bytes) | derivationKeySalt(64 bytes) | iv(16 bytes) | cipher(?)]

  const expectedPwdChallengeResult = Buffer.alloc(16);
  dataBuffer.copy(expectedPwdChallengeResult, 0, 16, 48);
  const passwordChallengeResponseBuffer = Buffer.from(passwordChallengeResponse, 'base64');

  const hasPassedPasswordChallenge = crypto.timingSafeEqual(
    expectedPwdChallengeResult,
    passwordChallengeResponseBuffer,
  );

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
