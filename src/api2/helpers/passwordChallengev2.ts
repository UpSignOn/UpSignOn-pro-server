import libsodium from 'libsodium-wrappers';
import { db } from '../../helpers/db';
import { fromBase64 } from './base64Convert';

export const createPasswordChallengeV2 = (
  encryptedDataString: string,
): {
  pwdChallengeBase64: string;
  pwdDerivationSaltBase64: string;
  derivationAlgorithm: string,
  cpuCost: number,
  memoryCost: number,
} => {
  if (!encryptedDataString.startsWith('formatP002-')) {
    throw Error("Calling createPasswordChallengeV2 with a data format that is not formatP002-");
  }
  // data = 'formatP002-derivationAlgoName-derivationCpuCost-derivationMemoryCost-derivationSalt-passwordChallenge-passwordChallengeExpectedResponse-nonce-cipherText'
  const parts = encryptedDataString.split("-");

  return { pwdChallengeBase64: parts[5], pwdDerivationSaltBase64: parts[4], derivationAlgorithm: parts[1], cpuCost: parseInt(parts[2]), memoryCost: parseInt(parts[3]) };
};

export const checkPasswordChallengeV2 = async (
  encryptedData: string,
  passwordChallengeResponse: string,
  passwordErrorCount: null | number,
  deviceId: string,
  groupId: number,
): Promise<{ hasPassedPasswordChallenge: boolean; blockedUntil?: Date }> => {
  if (!encryptedData.startsWith('formatP002-')) {
    throw Error("Calling checkPasswordChallengeV2 with a data format that is not formatP002-");
  }
  // data = 'formatP002-derivationAlgoName-derivationCpuCost-derivationMemoryCost-derivationSalt-passwordChallenge-passwordChallengeExpectedResponse-nonce-cipherText'
  
  const parts = encryptedData.split('-');
  const hashedPwdChallengeResponse = libsodium.crypto_generichash(libsodium.crypto_generichash_BYTES, fromBase64(passwordChallengeResponse));


  let hasPassedPasswordChallenge = libsodium.memcmp(fromBase64(parts[6]), hashedPwdChallengeResponse);

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


