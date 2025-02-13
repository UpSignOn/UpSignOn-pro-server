import Joi from 'joi';
import { db } from '../../../helpers/db';
import { logError, logInfo } from '../../../helpers/logger';
import { inputSanitizer } from '../../../helpers/sanitizer';
import { checkBasicAuth2 } from '../../helpers/authorizationChecks';

// @deprecated
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const removeRecipientFromSharedVault = async (req: any, res: any) => {
  try {
    const sharedVaultId = inputSanitizer.getNumberOrNull(req.body?.sharedVaultId);
    if (sharedVaultId == null) {
      logInfo(req.body?.userEmail, 'removeRecipientFromSharedVault fail: missing sharedVaultId');
      return res.status(403).end();
    }

    const recipientId = inputSanitizer.getNumberOrNull(req.body?.recipientId);
    if (recipientId == null) {
      logInfo(req.body?.userEmail, 'removeRecipientFromSharedVault fail: missing recipientId');
      return res.status(403).end();
    }

    const basicAuth = await checkBasicAuth2(req);
    if (!basicAuth.granted) {
      logInfo(req.body?.userEmail, 'removeRecipientFromSharedVault fail: auth not granted');
      return res.status(401).end();
    }

    if (basicAuth.userId !== recipientId) {
      // if not removing himself, check if is owner
      const ownershipCheck = await db.query(
        'SELECT access_level FROM shared_vault_recipients WHERE shared_vault_id=$1 AND user_id=$2 AND group_id=$3',
        [sharedVaultId, basicAuth.userId, basicAuth.groupId],
      );
      if (ownershipCheck.rows[0]?.access_level !== 'owner') {
        logInfo(req.body?.userEmail, 'removeRecipientFromSharedVault fail: not owner');
        return res.status(403).end();
      }
    }

    await db.query(
      'DELETE FROM shared_vault_recipients WHERE shared_vault_id=$1 AND user_id=$2 AND group_id=$3',
      [sharedVaultId, recipientId, basicAuth.groupId],
    );
    logInfo(req.body?.userEmail, 'removeRecipientFromSharedVault OK');
    return res.status(204).end();
  } catch (e) {
    logError(req.body?.userEmail, 'removeRecipientFromSharedVault', e);
    return res.status(400).end();
  }
};

// @deprecated
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const removeRecipientsFromSharedVault = async (req: any, res: any) => {
  try {
    let sharedVaultId;
    try {
      sharedVaultId = Joi.attempt(req.body?.sharedVaultId, Joi.number().required());
    } catch (err) {
      logError(req.body?.userEmail, err);
      return res.status(403).end();
    }

    let recipientIds;
    try {
      recipientIds = Joi.attempt(
        req.body?.recipientIds,
        Joi.array().required().items(Joi.number()),
      );
    } catch (err) {
      logError(req.body?.userEmail, err);
      return res.status(403).end();
    }

    const basicAuth = await checkBasicAuth2(req);
    if (!basicAuth.granted) {
      logInfo(req.body?.userEmail, 'removeRecipientFromSharedVault fail: auth not granted');
      return res.status(401).end();
    }

    const isRemovingOthers = recipientIds.filter((rId) => rId != basicAuth.userId);

    let isOwner = false;
    if (isRemovingOthers) {
      // Check if is owner
      const ownershipCheck = await db.query(
        'SELECT access_level FROM shared_vault_recipients WHERE shared_vault_id=$1 AND user_id=$2 AND group_id=$3',
        [sharedVaultId, basicAuth.userId, basicAuth.groupId],
      );
      if (ownershipCheck.rows[0]?.access_level === 'owner') {
        isOwner = true;
      }
    }

    if (isRemovingOthers && !isOwner) {
      logInfo(req.body?.userEmail, 'removeRecipientFromSharedVault fail: not owner');
      return res.status(403).end();
    }
    await db.query(
      'DELETE FROM shared_vault_recipients WHERE shared_vault_id=$1 AND user_id = ANY(($2)::INT[]) AND group_id=$3',
      [sharedVaultId, recipientIds, basicAuth.groupId],
    );
    logInfo(req.body?.userEmail, 'removeRecipientFromSharedVault OK');
    return res.status(204).end();
  } catch (e) {
    logError(req.body?.userEmail, 'removeRecipientFromSharedVault', e);
    return res.status(400).end();
  }
};
