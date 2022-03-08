import { db } from '../helpers/connection';
import { logError } from '../helpers/logger';
import { isStrictlyLowerVersion } from '../helpers/appVersionChecker';
import { checkBasicAuth } from '../helpers/authorizationChecks';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const unshareItemsThatWereMovedFromSharedFolder = async (
  req: any,
  res: any,
): Promise<void> => {
  try {
    const appVersion = req.body?.appVersion;
    if (isStrictlyLowerVersion(appVersion, '4.5.0')) {
      return res.status(403).send({ error: 'deprecated_app' });
    }

    const oldSharedAccountUsersToRemove = req.body?.oldSharedAccountUsersToRemove;
    if (!Array.isArray(oldSharedAccountUsersToRemove)) {
      return res.status(401).end();
    }

    const basicAuth = await checkBasicAuth(req);
    if (!basicAuth.granted) return res.status(401).end();

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
          logError('unshareItemsThatWereMovedFromSharedFolder errored in delete request', e);
        }
      }
    }

    return res.status(200).end();
  } catch (e) {
    logError('unshareItemsThatWereMovedFromSharedFolder', e);
    return res.status(400).end();
  }
};
