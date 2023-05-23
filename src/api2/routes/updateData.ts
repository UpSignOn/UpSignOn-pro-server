import { db } from '../../helpers/db';
import { getSharedVaults } from './getData';
import { logError } from '../../helpers/logger';
import { checkBasicAuth } from '../../helpers/authorizationChecks';
import { inputSanitizer } from '../../helpers/sanitizer';
import { hashPasswordChallengeResultForSecureStorage } from '../../helpers/passwordChallenge';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const updateData2 = async (req: any, res: any): Promise<void> => {
  try {
    const newEncryptedData = inputSanitizer.getString(req.body?.newEncryptedData);
    const lastUpdateDate = inputSanitizer.getString(req.body?.lastUpdateDate);
    const returningSharedVaults = inputSanitizer.getBoolean(req.body?.returningSharedVaults);

    // Check params
    if (!newEncryptedData) return res.status(403).end();
    if (!lastUpdateDate) return res.status(403).end();

    const basicAuth = await checkBasicAuth(req, {});
    if (!basicAuth.granted) return res.status(401).end();

    let updateRes;
    const newEncryptedDataWithPasswordChallengeSecured =
      hashPasswordChallengeResultForSecureStorage(newEncryptedData);
    updateRes = await db.query(
      'UPDATE users SET (encrypted_data, updated_at)=($1, CURRENT_TIMESTAMP(0)) WHERE users.email=$2 AND users.updated_at=CAST($3 AS TIMESTAMPTZ) AND users.group_id=$4 RETURNING updated_at',
      [
        newEncryptedDataWithPasswordChallengeSecured,
        basicAuth.userEmail,
        lastUpdateDate,
        basicAuth.groupId,
      ],
    );
    if (updateRes.rowCount === 0) {
      // CONFLICT
      return res.status(403).end();
    }

    if (returningSharedVaults) {
      const sharedVaults = await getSharedVaults(basicAuth.userId, basicAuth.groupId);
      return res.status(200).json({ lastUpdateDate: updateRes.rows[0].updated_at, sharedVaults });
    } else {
      return res.status(200).json({ lastUpdateDate: updateRes.rows[0].updated_at });
    }
  } catch (e) {
    logError('updateData2', e);
    return res.status(400).end();
  }
};
