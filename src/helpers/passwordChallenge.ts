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
  passwordErrorCount: null | number,
  deviceId: string,
  groupId: number,
): Promise<{ hasPassedPasswordChallenge: boolean; blockedUntil?: Date }> => {
  if (!encryptedData.startsWith('formatP001-')) {
    return { hasPassedPasswordChallenge: false };
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

  if (hasPassedPasswordChallenge) {
    return { hasPassedPasswordChallenge: true };
  }

  // Add a time constraint to the number of failed attempts per device
  const udpatedNumberOfFailedAttemtps = (passwordErrorCount || 0) + 1;

  // 3 attempts with no delay, then 1 minute for each additional previous failed attempt
  if (udpatedNumberOfFailedAttemtps % 3 !== 0) {
    await db.query(
      'UPDATE user_devices SET password_challenge_error_count=password_challenge_error_count+1, password_challenge_blocked_until=null WHERE id=$1 AND group_id=$2',
      [deviceId, groupId],
    );
    return { hasPassedPasswordChallenge: false };
  } else {
    const minRetryDate = new Date();
    minRetryDate.setTime(Date.now() + udpatedNumberOfFailedAttemtps * 60 * 1000); // block for udpatedNumberOfFailedAttemtps minutes
    await db.query(
      'UPDATE user_devices SET password_challenge_error_count=password_challenge_error_count+1, password_challenge_blocked_until=$1 WHERE id=$2 AND group_id=$3',
      [minRetryDate.toISOString(), deviceId, groupId],
    );
    return { hasPassedPasswordChallenge: false, blockedUntil: minRetryDate };
  }
};
