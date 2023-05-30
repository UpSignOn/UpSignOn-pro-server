import { db } from '../../../helpers/db';
import { logError } from '../../../helpers/logger';
import { inputSanitizer } from '../../../helpers/sanitizer';
import { hashPasswordChallengeResultForSecureStorage } from '../../../helpers/passwordChallenge';
import { checkBasicAuth2 } from '../../helpers/authorizationChecks';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const updateVaultData = async (req: any, res: any): Promise<void> => {
  try {
    const newEncryptedData = inputSanitizer.getString(req.body?.newEncryptedData);
    const lastUpdatedAt = inputSanitizer.getString(req.body?.lastUpdatedAt);

    // Check params
    if (!newEncryptedData) return res.status(403).end();
    if (!lastUpdatedAt) return res.status(403).end();

    const basicAuth = await checkBasicAuth2(req, {});
    if (!basicAuth.granted) return res.status(401).end();

    const newEncryptedDataWithPasswordChallengeSecured =
      hashPasswordChallengeResultForSecureStorage(newEncryptedData);
    const updateRes = await db.query(
      'UPDATE users SET (encrypted_data, updated_at)=($1, CURRENT_TIMESTAMP(0)) WHERE users.email=$2 AND users.updated_at=CAST($3 AS TIMESTAMPTZ) AND users.group_id=$4 RETURNING updated_at',
      [
        newEncryptedDataWithPasswordChallengeSecured,
        basicAuth.userEmail,
        lastUpdatedAt,
        basicAuth.groupId,
      ],
    );
    if (updateRes.rowCount === 0) {
      // CONFLICT
      return res.status(409).json({ error: "outdated" });
    }

    return res.status(200).json({ lastUpdatedAt: updateRes.rows[0].updated_at });
  } catch (e) {
    logError('updateData2', e);
    return res.status(400).end();
  }
};
