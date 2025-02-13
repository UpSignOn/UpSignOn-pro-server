import Joi from 'joi';
import { db } from '../../../helpers/db';
import { logError, logInfo } from '../../../helpers/logger';
import { inputSanitizer } from '../../../helpers/sanitizer';
import { checkBasicAuth2 } from '../../helpers/authorizationChecks';

// @deprecated
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const updateRecipientRightsOnSharedVault = async (req: any, res: any) => {
  try {
    const sharedVaultId = inputSanitizer.getNumberOrNull(req.body?.sharedVaultId);
    if (sharedVaultId == null) {
      logInfo(
        req.body?.userEmail,
        'updateRecipientRightsOnSharedVault fail: missing sharedVaultId',
      );
      return res.status(403).end();
    }

    const recipientId = inputSanitizer.getNumberOrNull(req.body?.recipientId);
    if (recipientId == null) {
      logInfo(req.body?.userEmail, 'updateRecipientRightsOnSharedVault fail: recipientId was null');
      return res.status(403).end();
    }

    let willBeManager = inputSanitizer.getBoolean(req.body?.willBeManager);
    let accessLevel = inputSanitizer.getString(req.body?.updatedAccessLevel);

    if (accessLevel != null) {
      willBeManager = accessLevel === 'owner';
    } else {
      accessLevel = willBeManager ? 'owner' : 'reader';
    }

    const basicAuth = await checkBasicAuth2(req, { checkIsOwnerForVaultId: sharedVaultId });
    if (!basicAuth.granted) {
      logInfo(req.body?.userEmail, 'updateRecipientRightsOnSharedVault fail: auth not granted');
      return res.status(401).end();
    }
    // Check we are not removing the last manager
    if (recipientId == basicAuth.userId) {
      const checkRes = await db.query(
        "SELECT count(*) AS count FROM shared_vault_recipients WHERE access_level='owner' AND shared_vault_id=$1 AND group_id=$2",
        [sharedVaultId, basicAuth.groupId],
      );
      if (checkRes.rows[0].count == 1) {
        logInfo(req.body?.userEmail, 'updateRecipientRightsOnSharedVault fail: last_owner_error');
        if (req.body?.accessLevel != null) {
          return res.status(403).json({ error: 'last_owner_error' });
        } else {
          // old error code
          // TODO: remove in a future release
          return res.status(403).json({ error: 'last_manager_error' });
        }
      }
    }

    await db.query(
      'UPDATE shared_vault_recipients SET is_manager=$1, access_level=$2 WHERE shared_vault_id=$3 AND user_id=$4 AND group_id=$5',
      [willBeManager, accessLevel, sharedVaultId, recipientId, basicAuth.groupId],
    );
    logInfo(req.body?.userEmail, 'updateRecipientRightsOnSharedVault OK');
    return res.status(204).end();
  } catch (e) {
    logError(req.body?.userEmail, 'updateRecipientRightsOnSharedVault', e);
    return res.status(400).end();
  }
};

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const updateRecipientsRightsOnSharedVault = async (req: any, res: any) => {
  try {
    const sharedVaultId = inputSanitizer.getNumberOrNull(req.body?.sharedVaultId);
    if (sharedVaultId == null) {
      logInfo(
        req.body?.userEmail,
        'updateRecipientsRightsOnSharedVault fail: missing sharedVaultId',
      );
      return res.status(403).end();
    }

    let recipientIds;
    try {
      recipientIds = Joi.attempt(
        req.body?.recipientIds,
        Joi.array().required().items(Joi.number()),
      );
    } catch (err) {
      logInfo(
        req.body?.userEmail,
        'updateRecipientsRightsOnSharedVault fail: recipientId was null',
      );
      return res.status(403).end();
    }

    let willBeManager = inputSanitizer.getBoolean(req.body?.willBeManager);
    let accessLevel = inputSanitizer.getString(req.body?.updatedAccessLevel);

    if (accessLevel != null) {
      willBeManager = accessLevel === 'owner';
    } else {
      accessLevel = willBeManager ? 'owner' : 'reader';
    }

    const basicAuth = await checkBasicAuth2(req, { checkIsOwnerForVaultId: sharedVaultId });
    if (!basicAuth.granted) {
      logInfo(req.body?.userEmail, 'updateRecipientsRightsOnSharedVault fail: auth not granted');
      return res.status(401).end();
    }
    // Check we are not removing the last manager
    if (recipientIds.indexOf(basicAuth.userId) >= 0 && accessLevel !== 'owner') {
      const checkRes = await db.query(
        "SELECT count(*) AS count FROM shared_vault_recipients WHERE access_level='owner' AND shared_vault_id=$1 AND group_id=$2",
        [sharedVaultId, basicAuth.groupId],
      );
      if (checkRes.rows[0].count == 1) {
        logInfo(req.body?.userEmail, 'updateRecipientsRightsOnSharedVault fail: last_owner_error');
        return res.status(403).json({ error: 'last_owner_error' });
      }
    }

    await db.query(
      'UPDATE shared_vault_recipients SET is_manager=$1, access_level=$2 WHERE shared_vault_id=$3 AND user_id = ANY(($4)::INT[]) AND group_id=$5',
      [willBeManager, accessLevel, sharedVaultId, recipientIds, basicAuth.groupId],
    );
    logInfo(req.body?.userEmail, 'updateRecipientsRightsOnSharedVault OK');
    return res.status(204).end();
  } catch (e) {
    logError(req.body?.userEmail, 'updateRecipientsRightsOnSharedVault', e);
    return res.status(400).end();
  }
};
