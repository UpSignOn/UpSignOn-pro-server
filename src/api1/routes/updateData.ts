import { db } from '../../helpers/db';
import { getSharedItems } from './getData';
import { logError } from '../../helpers/logger';
import { checkBasicAuth } from '../../helpers/authorizationChecks';
import { inputSanitizer } from '../../helpers/sanitizer';
import { hashPasswordChallengeResultForSecureStorage } from '../../helpers/passwordChallenge';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const updateData = async (req: any, res: any): Promise<void> => {
  try {
    const newEncryptedData = inputSanitizer.getString(req.body?.newEncryptedData);
    const lastUpdatedAt = inputSanitizer.getString(req.body?.lastUpdatedAt);
    const isNewData = inputSanitizer.getBoolean(req.body?.isNewData); // DEPRECATED => this route is no longer used to add an empty space
    const sharingPublicKey = inputSanitizer.getString(req.body?.sharingPublicKey); // DEPRECATED => this route is no longer used to add an empty space
    const returningSharedItems = inputSanitizer.getBoolean(req.body?.returningSharedItems);

    // Check params
    if (!newEncryptedData) return res.status(401).end();
    if (!isNewData && !lastUpdatedAt) return res.status(409).end(); // Behave like a CONFLICT
    if (isNewData && !sharingPublicKey) return res.status(409).end(); // Behave like a CONFLICT

    const basicAuth = await checkBasicAuth(req, { returningData: true });
    if (!basicAuth.granted) return res.status(401).end();

    // Update DB
    if (isNewData && !!basicAuth.encryptedData) {
      // a security to increase resilience in case the app contained a bug and tried to update the user's space with empty data
      logError('updateData - Attempted to init user data where data already exists.');
      return res.status(400).end();
    }
    let updateRes;
    const newEncryptedDataWithPasswordChallengeSecured =
      hashPasswordChallengeResultForSecureStorage(newEncryptedData);
    if (isNewData) {
      updateRes = await db.query(
        'UPDATE users SET (encrypted_data, updated_at, sharing_public_key)=($1, CURRENT_TIMESTAMP(0), $2) WHERE users.email=$3 AND users.group_id=$4 RETURNING updated_at',
        [
          newEncryptedDataWithPasswordChallengeSecured,
          sharingPublicKey,
          basicAuth.userEmail,
          basicAuth.groupId,
        ],
      );
    } else {
      updateRes = await db.query(
        'UPDATE users SET (encrypted_data, updated_at)=($1, CURRENT_TIMESTAMP(0)) WHERE users.email=$2 AND users.updated_at=CAST($3 AS TIMESTAMPTZ) AND users.group_id=$4 RETURNING updated_at',
        [
          newEncryptedDataWithPasswordChallengeSecured,
          basicAuth.userEmail,
          lastUpdatedAt,
          basicAuth.groupId,
        ],
      );
    }
    if (updateRes.rowCount === 0) {
      // CONFLICT
      return res.status(409).end();
    }

    if (returningSharedItems) {
      const sharedItems = await getSharedItems(basicAuth.userId, basicAuth.groupId);
      return res.status(200).json({ lastUpdatedAt: updateRes.rows[0].updated_at, sharedItems });
    } else {
      return res.status(200).json({ lastUpdatedAt: updateRes.rows[0].updated_at });
    }
  } catch (e) {
    logError('updateData', e);
    return res.status(400).end();
  }
};
