import { db } from '../../helpers/db';
import { logError } from '../../helpers/logger';
import { createDeviceChallengeV1 } from '../helpers/deviceChallengev1';
import { createPasswordChallengeV1 } from '../helpers/passwordChallengev1';
import { inputSanitizer } from '../../helpers/sanitizer';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const getAuthenticationChallenges = async (req: any, res: any) => {
  try {
    const deviceId = inputSanitizer.getString(req.body?.deviceId);
    const userEmail = inputSanitizer.getLowerCaseString(req.body?.userEmail);
    const groupId = inputSanitizer.getNumber(req.params.groupId, 1);

    if (!userEmail || !deviceId) {
      return res.status(401).end();
    }

    const dbRes = await db.query(
      `SELECT
        u.id AS uid,
        u.encrypted_data AS encrypted_data,
        ud.id AS did,
        char_length(ud.access_code_hash) > 0 AS has_access_code_hash,
        char_length(ud.device_public_key) > 0 AS has_device_public_key,
        ud.authorization_status AS authorization_status,
        g.settings AS group_settings
      FROM user_devices AS ud
      INNER JOIN users AS u ON ud.user_id = u.id
      INNER JOIN groups AS g ON g.id = u.group_id
      WHERE
        u.email=$1
        AND ud.device_unique_id = $2
        AND u.group_id=$3
      `,
      [userEmail, deviceId, groupId],
    );

    if (!dbRes || dbRes.rowCount === 0) {
      // Check if the email address has changed
      const emailChangeRes = await db.query(
        'SELECT user_id, new_email FROM changed_emails WHERE old_email=$1 AND group_id=$2',
        [userEmail, groupId],
      );
      if (emailChangeRes.rowCount === 0) {
        return res.status(404).json({ error: 'revoked' });
      } else {
        return res.status(401).json({ newEmailAddress: emailChangeRes.rows[0].new_email });
      }
    }
    if (
      dbRes.rows[0].authorization_status === 'REVOKED_BY_ADMIN' ||
      dbRes.rows[0].authorization_status === 'REVOKED_BY_USER'
    ) {
      return res.status(404).json({ error: 'revoked' });
    }

    if (
      dbRes.rows[0].group_settings?.IS_TESTING &&
      new Date(dbRes.rows[0].group_settings?.TESTING_EXPIRATION_DATE) < new Date()
    ) {
      return res.status(404).json({ error: 'test_expired' });
    }

    if (dbRes.rows[0].authorization_status !== 'AUTHORIZED')
      return res.status(401).json({
        error: 'other_authorization_status',
        authorizationStatus: dbRes.rows[0].authorization_status,
      });

    if (dbRes.rows[0].has_access_code_hash || !dbRes.rows[0].has_device_public_key)
      return res.status(401).end();

    const deviceChallenge = await createDeviceChallengeV1(dbRes.rows[0].did);
    if (!dbRes.rows[0].encrypted_data) {
      return res.status(404).json({ error: 'empty_data', deviceChallenge });
    }

    const passwordChallenge = createPasswordChallengeV1(dbRes.rows[0].encrypted_data);

    return res.status(200).json({
      passwordChallenge: passwordChallenge.pwdChallengeBase64,
      passwordDerivationSalt: passwordChallenge.pwdDerivationSaltBase64,
      deviceChallenge,
      derivationAlgorithm: passwordChallenge.derivationAlgorithm, // for migration to v2
      cpuCost: passwordChallenge.cpuCost, // for migration to v2
      memoryCost: passwordChallenge.memoryCost, // for migration to v2
    });
  } catch (e) {
    logError('getAuthenticationChallenges', e);
    return res.status(400).end();
  }
};
