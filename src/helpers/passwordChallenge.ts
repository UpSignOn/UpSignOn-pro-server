import crypto from 'crypto';
import { db } from './db';

export const createPasswordChallenge = (
  encryptedDataString: string,
): {
  pwdChallengeBase64: string;
  pwdDerivationSaltBase64: string;
  signingKeySaltBase64: string;
} => {
  if (!encryptedDataString.startsWith('formatP001-')) {
    // The password challenge will not exist when the data has not yet been reencrypted by a v5+ app
    // However, in order for the v5+ app to continue working or being able to enroll a new device for a data that is still in the old format (where the password challenge does not exist)
    // the server should fallback to the letting the app receive the encrypted data if the device alone can be authenticated (as in the previous system)
    // To make it easy, we return a default challenge that will not be checked.
    return {
      pwdChallengeBase64: 'NONE',
      pwdDerivationSaltBase64: 'NONE',
      signingKeySaltBase64: 'NONE',
    };
  }
  // data = ['formatP001-' | passwordDerivationKeySalt(44chars) | challengeBase64(24 chars) | challengeHashBase64(44 chars) | 'formatK001-' | cipherSignatureBase64(44 chars) | signingKeySalt(44 chars) | ivBase64(24 chars) | cipherBase64(?)]
  const pwdDerivationSaltBase64 = encryptedDataString.substring(11, 55);
  const pwdChallengeBase64 = encryptedDataString.substring(55, 79);
  const signingKeySaltBase64 = encryptedDataString.substring(178, 222);

  return { pwdChallengeBase64, pwdDerivationSaltBase64, signingKeySaltBase64 };
};

export const checkPasswordChallenge = async (
  encryptedData: string,
  passwordChallengeResponse: string,
  passwordErrorCount: null | number,
  deviceId: string,
  groupId: number,
): Promise<{ hasPassedPasswordChallenge: boolean; blockedUntil?: Date }> => {
  if (!encryptedData.startsWith('formatP001-')) {
    return { hasPassedPasswordChallenge: true }; // This would be the case when the NONE fallback were sent as the password challenge
  }
  // data = ['formatP001-' | passwordDerivationKeySalt(44chars) | challengeBase64(24 chars) | challengeHashBase64(44 chars) | 'formatK001-' | cipherSignatureBase64(44 chars) | signingKeySalt(44 chars) | ivBase64(24 chars) | cipherBase64(?)]
  const expectedPwdChallengeResult = Buffer.from(encryptedData.substring(79, 123), 'base64');
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
