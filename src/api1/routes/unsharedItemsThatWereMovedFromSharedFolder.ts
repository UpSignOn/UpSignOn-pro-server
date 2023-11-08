import { db } from '../../helpers/db';
import { logError } from '../../helpers/logger';
import { isStrictlyLowerVersion } from '../../helpers/appVersionChecker';
import { PREVENT_V1_API_WHEN_V2_DATA, checkBasicAuth } from '../helpers/authorizationChecks';
import { inputSanitizer } from '../../helpers/sanitizer';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const unshareItemsThatWereMovedFromSharedFolder = async (
  req: any,
  res: any,
): Promise<void> => {
  try {
    const appVersion = inputSanitizer.getString(req.body?.appVersion);
    if (isStrictlyLowerVersion(appVersion, '4.5.0')) {
      return res.status(403).send({ error: 'deprecated_app' });
    }

    const oldSharedAccountUsersToRemove = inputSanitizer.getArrayOfSharedAccountUsersToRemove(
      req.body?.oldSharedAccountUsersToRemove,
    );
    if (!oldSharedAccountUsersToRemove) {
      return res.status(401).end();
    }

    const basicAuth = await checkBasicAuth(req);
    if (!basicAuth.granted) return res.status(401).end();

    const hasDataV2Res = await db.query(
      'SELECT length(encrypted_data_2) AS data2_length FROM users WHERE id=$1',
      [basicAuth.userId],
    );
    if (PREVENT_V1_API_WHEN_V2_DATA && hasDataV2Res.rows[0].data2_length > 0) {
      return res.status(403).json({ error: 'deprecated_app' });
    }

    // check that current user is manager for all these sharings
    const uniqueSharedAccountIds: number[] = [];
    for (let i = 0; i < oldSharedAccountUsersToRemove.length; i++) {
      const sharedAccountUser = oldSharedAccountUsersToRemove[i];
      if (!Array.isArray(sharedAccountUser.sharedAccountIds)) {
        return res.status(401).end();
      }
      for (let j = 0; j < sharedAccountUser.sharedAccountIds.length; j++) {
        const acId = sharedAccountUser.sharedAccountIds[j];
        if (!uniqueSharedAccountIds.includes(acId)) {
          uniqueSharedAccountIds.push(acId);
        }
      }
    }
    for (let i = 0; i < uniqueSharedAccountIds.length; i++) {
      const isManagerRes = await db.query(
        'SELECT is_manager FROM shared_account_users WHERE shared_account_id=$1 AND user_id=$2 AND group_id=$3',
        [uniqueSharedAccountIds[i], basicAuth.userId, basicAuth.groupId],
      );
      if (!isManagerRes?.rows[0] || !isManagerRes.rows[0].is_manager) {
        return res.status(401).end();
      }
    }

    // Then delete sharings one by one
    for (let i = 0; i < oldSharedAccountUsersToRemove.length; i++) {
      const sharedAccountUser = oldSharedAccountUsersToRemove[i];
      for (let j = 0; j < sharedAccountUser.sharedAccountIds.length; j++) {
        try {
          await db.query(
            'DELETE FROM shared_account_users WHERE shared_account_id=$1 AND user_id=$2 AND group_id=$3',
            [sharedAccountUser.sharedAccountIds[j], sharedAccountUser.contactId, basicAuth.groupId],
          );
        } catch (e) {
          logError(
            req.body?.userEmail,
            'unshareItemsThatWereMovedFromSharedFolder errored in delete request',
            e,
          );
        }
      }
    }

    return res.status(200).end();
  } catch (e) {
    logError(req.body?.userEmail, 'unshareItemsThatWereMovedFromSharedFolder', e);
    return res.status(400).end();
  }
};
