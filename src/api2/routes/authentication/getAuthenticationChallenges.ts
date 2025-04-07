import { db } from '../../../helpers/db';
import { logError, logInfo } from '../../../helpers/logger';
import { createDeviceChallengeV2 } from '../../helpers/deviceChallengev2';
import { createPasswordChallengeV2 } from '../../helpers/passwordChallengev2';
import { inputSanitizer } from '../../../helpers/sanitizer';
import { IS_ACTIVE } from '../../../helpers/serverStatus';
import { getGroupIds } from '../../helpers/bankUUID';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const getAuthenticationChallenges2 = async (req: any, res: any) => {
  try {
    if (!IS_ACTIVE) {
      return res.status(403).json({ error: 'test_expired' });
    }
    const deviceId = inputSanitizer.getString(req.body?.deviceId);
    const userEmail = inputSanitizer.getLowerCaseString(req.body?.userEmail);
    const groupIds = await getGroupIds(req);

    if (!userEmail || !deviceId) {
      logInfo(req.body?.userEmail, 'getAuthenticationChallenges2 fail: some parameter was missing');
      return res.status(403).end();
    }

    const dbRes = await db.query(
      `SELECT
        u.id AS uid,
        u.encrypted_data_2 AS encrypted_data_2,
        u.deactivated AS deactivated,
        ud.id AS did,
        ud.authorization_status AS authorization_status,
        g.settings AS group_settings,
        g.stop_this_instance AS stop_this_instance,
        ud.encrypted_password_backup_2 AS encrypted_password_backup_2
      FROM user_devices AS ud
      INNER JOIN users AS u ON ud.user_id = u.id
      INNER JOIN groups AS g ON g.id = u.group_id
      WHERE
        u.email=$1
        AND ud.device_unique_id = $2
        AND u.group_id=$3
      `,
      [userEmail, deviceId, groupIds.internalId],
    );

    if (!dbRes || dbRes.rowCount === 0) {
      // Check if the email address has changed
      const emailChangeRes = await db.query(
        'SELECT user_id, new_email FROM changed_emails WHERE old_email=$1 AND group_id=$2',
        [userEmail, groupIds.internalId],
      );
      if (emailChangeRes.rowCount === 0) {
        logInfo(req.body?.userEmail, 'getAuthenticationChallenges2 fail: device deleted');
        return res.status(403).json({ error: 'revoked' });
      } else {
        logInfo(req.body?.userEmail, 'getAuthenticationChallenges2 fail: email address updated');
        return res.status(403).json({ newEmailAddress: emailChangeRes.rows[0].new_email });
      }
    }
    if (dbRes.rows[0].stop_this_instance) {
      logInfo('instance stopped');
      return res.status(400).end();
    }
    if (dbRes.rows[0].authorization_status === 'REVOKED_BY_USER') {
      logInfo(req.body?.userEmail, 'getAuthenticationChallenges2 fail: device revoked by user');
      return res.status(403).json({ error: 'revoked' });
    }
    if (dbRes.rows[0].authorization_status === 'REVOKED_BY_ADMIN' || dbRes.rows[0].deactivated) {
      logInfo(
        req.body?.userEmail,
        'getAuthenticationChallenges2 fail: device revoked by admin or deactivated',
      );
      return res.status(403).json({ error: 'revoked_by_admin' });
    }
    if (dbRes.rows[0].authorization_status === 'USER_VERIFIED_PENDING_ADMIN_CHECK') {
      logInfo(
        req.body?.userEmail,
        'getAuthenticationChallenges2 fail: device still pending admin check',
      );
      return res.status(403).json({ error: 'pending_admin_authorization' });
    }

    if (
      dbRes.rows[0].group_settings?.IS_TESTING &&
      (!dbRes.rows[0].group_settings?.TESTING_EXPIRATION_DATE ||
        new Date(dbRes.rows[0].group_settings.TESTING_EXPIRATION_DATE) < new Date())
    ) {
      logInfo(req.body?.userEmail, 'getAuthenticationChallenges2 fail: test expired');
      return res.status(403).json({ error: 'test_expired' });
    }

    if (dbRes.rows[0].authorization_status !== 'AUTHORIZED') {
      logInfo(
        req.body?.userEmail,
        'getAuthenticationChallenges2 fail: device status',
        dbRes.rows[0].authorization_status,
      );

      return res.status(403).json({
        error: 'other_authorization_status',
        authorizationStatus: dbRes.rows[0].authorization_status,
      });
    }

    const deviceChallenge = await createDeviceChallengeV2(dbRes.rows[0].did);

    if (dbRes.rows[0].encrypted_data_2) {
      const passwordChallenge = createPasswordChallengeV2(dbRes.rows[0].encrypted_data_2);

      logInfo(req.body?.userEmail, 'getAuthenticationChallenges2 OK');
      return res.status(200).json({
        passwordChallenge: passwordChallenge.pwdChallengeBase64,
        passwordDerivationSalt: passwordChallenge.pwdDerivationSaltBase64,
        deviceChallenge,
        dataFormat: passwordChallenge.dataFormat,
        derivationAlgorithm: passwordChallenge.derivationAlgorithm,
        cpuCost: passwordChallenge.cpuCost,
        memoryCost: passwordChallenge.memoryCost,
        hasPasswordBackup: !!dbRes.rows[0].encrypted_password_backup_2,
      });
    } else {
      logInfo(req.body?.userEmail, 'getAuthenticationChallenges2 fail: empty data');
      return res.status(403).json({ error: 'empty_data', deviceChallenge });
    }
  } catch (e) {
    logError(req.body?.userEmail, 'getAuthenticationChallenges2', e);
    return res.status(400).end();
  }
};
