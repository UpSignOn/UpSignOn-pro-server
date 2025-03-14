import Joi from 'joi';
import { db } from '../../../helpers/db';
import { logError, logInfo } from '../../../helpers/logger';
import { checkBasicAuth2 } from '../../helpers/authorizationChecks';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const upsertShamirBackup = async (req: any, res: any): Promise<void> => {
  try {
    const basicAuth = await checkBasicAuth2(req);
    if (!basicAuth.granted) {
      logInfo(req.body?.userEmail, 'upsertShamirBackup fail: auth not granted');
      return res.status(401).end();
    }

    const expectedSchema = Joi.array().items(
      Joi.object({
        recipientId: Joi.number().required(),
        encryptedShare: Joi.string().required(),
      }),
    );

    let recipientShares;
    try {
      recipientShares = Joi.attempt(req.body?.recipientShares, expectedSchema);
    } catch (err) {
      logInfo(req.body?.userEmail, err);
      return res.status(403).end();
    }
    try {
      await db.query('BEGIN');
      // remove previous shamir backup
      await db.query('DELETE FROM shamir_shares WHERE user_id=$1', [basicAuth.userId]);
      for (let i = 0; i < recipientShares.length; i++) {
        await db.query(
          `INSERT INTO shamir_shares
          (user_id, shamir_recipient_id, encrypted_share)
          VALUES ($1, $2, $3)
          `,
          [basicAuth.userId, recipientShares[i].recipientId, recipientShares[i].encryptedShare],
        );
      }
      // abort all recovery requests that were pending for this user
      await db.query(
        "UPDATE shamir_recovery_requests AS srr SET srr.status='ABORTED' FROM user_devices AS ud WHERE srr.status='PENDING' AND ud.id=srr.device_id AND ud.user_id=$1",
        [basicAuth.userId],
      );
      await db.query('COMMIT');
    } catch (e) {
      logError(req.body?.userEmail, e);
      await db.query('ROLLBACK');
      return res.status(403).json({ error: 'backup_creation_failed' });
    }

    return res.status(200).end();
  } catch (e) {
    logError(req.body?.userEmail, 'upsertShamirBackup', e);
    return res.status(400).end();
  }
};
